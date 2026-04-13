import type { AppBskyEmbedDefs } from '@atcute/bluesky';
import { remove as removeExif } from '@mary/exif-rm';

const POST_MAX_BYTES = 2_000_000;
const DEFAULT_MAX_BYTES = 1_000_000;

// matches the largest dimensions the bluesky image CDN will serve
const POST_MAX_DIM = 4_000;
const LINK_THUMB_MAX_DIM = 2_000;

const MAX_ATTEMPTS = 5;
const MAX_QUALITY = 92;
const MIN_QUALITY = 80;
// don't shrink below half of the fitted dimensions; below this we drop quality instead
const MIN_SCALE = 0.5;
// aim slightly under the byte budget so a small prediction error doesn't bounce us back over
const TARGET_HEADROOM = 0.95;

const enum Crop {
	CONTAIN,
	COVER,
}

interface CompressOptions {
	maxBytes: number;
	maxWidth: number;
	maxHeight: number;
	type: 'image/webp' | 'image/jpeg';
	crop: Crop;
	/** if set, source blobs whose mime type is in this list may skip re-encoding when already under the byte budget */
	acceptedSourceTypes?: readonly string[];
}

export interface CompressResult {
	blob: Blob;
	aspectRatio: AppBskyEmbedDefs.AspectRatio;
}

export const compressPostImage = (blob: Blob): Promise<CompressResult> => {
	return compressImage(blob, {
		maxBytes: POST_MAX_BYTES,
		maxWidth: POST_MAX_DIM,
		maxHeight: POST_MAX_DIM,
		type: 'image/webp',
		crop: Crop.CONTAIN,
	});
};

export const compressLinkThumbImage = (blob: Blob): Promise<CompressResult> => {
	return compressImage(blob, {
		maxBytes: DEFAULT_MAX_BYTES,
		maxWidth: LINK_THUMB_MAX_DIM,
		maxHeight: LINK_THUMB_MAX_DIM,
		type: 'image/webp',
		crop: Crop.CONTAIN,
	});
};

export const compressProfileImage = (blob: Blob, maxW: number, maxH: number): Promise<CompressResult> => {
	return compressImage(blob, {
		maxBytes: DEFAULT_MAX_BYTES,
		maxWidth: maxW,
		maxHeight: maxH,
		// profile avatars and banners only accept JPEG and PNG
		type: 'image/jpeg',
		crop: Crop.COVER,
		acceptedSourceTypes: ['image/jpeg', 'image/png'],
	});
};

/**
 * compress an image to fit a byte budget while preserving as much resolution as possible.
 *
 * uses up to {@link MAX_ATTEMPTS} encode passes. quality is held at {@link MAX_QUALITY} and
 * resolution is shrunk first (digital art tolerates resolution loss far better than the banding
 * and edge artifacts that appear below q≈80). only after hitting {@link MIN_SCALE} does the
 * search drop quality to {@link MIN_QUALITY} as a last resort.
 *
 * @param blob source image
 * @param opts size, format, and crop policy
 * @returns the encoded blob and its final aspect ratio
 * @throws if no attempt produces a blob within the byte budget
 */
const compressImage = async (blob: Blob, opts: CompressOptions): Promise<CompressResult> => {
	// strip exif first — may bring an oversized source under budget
	blob = await stripExif(blob);

	const image = await getImageFromBlob(blob);

	// fast path: source already fits — keep the original encoding rather than re-encoding losslessly to a worse format
	if (
		blob.size <= opts.maxBytes &&
		(opts.acceptedSourceTypes === undefined || opts.acceptedSourceTypes.includes(blob.type))
	) {
		return {
			blob: blob,
			aspectRatio: { width: image.naturalWidth, height: image.naturalHeight },
		};
	}

	const [fittedW, fittedH] = computeFittedDims(
		image.naturalWidth,
		image.naturalHeight,
		opts.maxWidth,
		opts.maxHeight,
		opts.crop,
	);
	const minW = Math.floor(fittedW * MIN_SCALE);
	const minH = Math.floor(fittedH * MIN_SCALE);

	let width = fittedW;
	let height = fittedH;
	let quality = MAX_QUALITY;
	let best: CompressResult | undefined;

	for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
		const canvas = renderCanvas(image, width, height);
		const encoded = await canvas.convertToBlob({ type: opts.type, quality: quality / 100 });

		if (encoded.size <= opts.maxBytes) {
			// quality is already pinned at our ceiling, so the first fit IS the best result we can produce
			best = { blob: encoded, aspectRatio: { width, height } };
			break;
		}

		// overshoot: encoded byte count scales roughly with pixel count, so derive the next linear scale
		// from sqrt(target / actual). converges in 1–2 iterations for well-behaved images.
		const ratio = Math.sqrt((opts.maxBytes * TARGET_HEADROOM) / encoded.size);
		const nextW = Math.floor(width * ratio);
		const nextH = Math.floor(height * ratio);

		if (nextW < minW || nextH < minH) {
			width = minW;
			height = minH;
			if (quality > MIN_QUALITY) {
				quality = MIN_QUALITY;
			} else {
				break;
			}
		} else {
			width = nextW;
			height = nextH;
		}
	}

	if (!best) {
		throw new Error(`unable to compress image to fit ${opts.maxBytes} bytes`);
	}

	return best;
};

/**
 * remove EXIF metadata from a supported image blob. returns the original blob unchanged
 * if the format isn't recognized by the exif stripper.
 *
 * @param blob source image
 * @returns a blob with EXIF removed, or the original blob if no stripping was applied
 */
export const stripExif = async (blob: Blob): Promise<Blob> => {
	const stripped = removeExif(new Uint8Array(await blob.arrayBuffer()));
	if (stripped === null) {
		return blob;
	}
	return new Blob([stripped as Uint8Array<ArrayBuffer>], { type: blob.type });
};

export const getImageFromBlob = async (blob: Blob): Promise<HTMLImageElement> => {
	const image = new Image();
	const blobUrl = URL.createObjectURL(blob);

	image.src = blobUrl;

	try {
		await image.decode();
	} finally {
		URL.revokeObjectURL(blobUrl);
	}

	return image;
};

const computeFittedDims = (
	srcW: number,
	srcH: number,
	maxW: number,
	maxH: number,
	mode: Crop,
): [number, number] => {
	let scale = 1;

	if (srcW > maxW || srcH > maxH) {
		if (mode === Crop.COVER) {
			scale = srcW < srcH ? maxW / srcW : maxH / srcH;
		} else {
			scale = srcW > srcH ? maxW / srcW : maxH / srcH;
		}
	}

	return [Math.floor(srcW * scale), Math.floor(srcH * scale)];
};

const renderCanvas = (img: HTMLImageElement, w: number, h: number): OffscreenCanvas => {
	const canvas = new OffscreenCanvas(w, h);
	const ctx = canvas.getContext('2d');

	if (!ctx) {
		throw new Error(`failed to compress image, unable to create canvas`);
	}

	ctx.drawImage(img, 0, 0, w, h);
	return canvas;
};
