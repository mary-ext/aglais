import type { AppBskyEmbedDefs } from '@atcute/bluesky';
import { remove as removeExif } from '@mary/exif-rm';

import { cover } from './crop';

const POST_MAX_BYTES = 2_000_000;
const DEFAULT_MAX_BYTES = 1_000_000;

// matches the largest dimensions the bluesky image CDN will serve
const POST_MAX_DIM = 4_000;
const LINK_THUMB_MAX_DIM = 2_000;

const QUALITY_STEPS = [92, 88, 84, 80] as const;
const MAX_QUALITY = QUALITY_STEPS[0];

// #region prediction table

// leave 8% room for per-image deviation from the population median; baseline R² of
// `anchorBytes × ratio` vs actual is 0.94–0.99 across cells, so this covers the p95
// error at every reasonable cell.
const PREDICTION_HEADROOM = 0.92;

const PREDICTION_SCALES = [1.0, 0.9, 0.8, 0.7, 0.6] as const;

/**
 * median encoded-bytes ratios vs the anchor (scale=1.0, q=92), measured via headless
 * Chromium's `OffscreenCanvas.convertToBlob` webp encoder on 64 cc-licensed test images
 * spanning photos, illustrations, and screenshots. rows correspond to
 * {@link PREDICTION_SCALES}, cols to {@link QUALITY_STEPS}.
 *
 * the row structure is non-trivial: the canvas 2d downsampler produces slightly smoother
 * intermediate pixels than a standalone lanczos resize, so mid-scale rows have lower
 * ratios than a jpeg-derived table would predict. the values are specific to the browser
 * encoder pipeline, not libwebp in general.
 */
const PREDICTION_RATIOS: readonly (readonly number[])[] = [
	[1.0, 0.8, 0.656, 0.558],
	[0.809, 0.618, 0.501, 0.421],
	[0.686, 0.526, 0.427, 0.361],
	[0.579, 0.447, 0.362, 0.307],
	[0.469, 0.367, 0.295, 0.248],
];

// #endregion

// #region iterative fallback

const MAX_ATTEMPTS = 8;
// once dimensions have already dropped somewhat, start trading off quality too
const SOFT_MIN_SCALE = 0.8;
// don't shrink below roughly three-fifths of the fitted dimensions unless we have no other choice
const HARD_MIN_SCALE = 0.6;
// aim slightly under the byte budget so a small prediction error doesn't bounce us back over
const TARGET_HEADROOM = 0.95;

// #endregion

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
 * compress an image to fit a byte budget.
 *
 * starts with an anchor encode at {@link MAX_QUALITY} / full fitted dims. if the anchor
 * fits, it ships. otherwise, for webp CONTAIN inputs, an empirical lookup table
 * ({@link PREDICTION_RATIOS}) picks the highest-scoring (scale, quality) cell whose
 * predicted byte count fits, and encodes once there. anything not covered by the table
 * (jpeg profile images, prediction misses) falls through to an iterative shrink-and-
 * quality-walk search seeded with the anchor.
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

	// anchor encode: full fitted dims at max quality. often fits directly, and supplies the
	// per-image byte count used by the predictor and iterative fallback.
	const anchorBlob = await encodeAt(image, fittedW, fittedH, MAX_QUALITY, opts);
	if (anchorBlob.size <= opts.maxBytes) {
		return { blob: anchorBlob, aspectRatio: { width: fittedW, height: fittedH } };
	}

	let result: CompressResult | undefined;

	// table-based prediction is only validated for webp CONTAIN
	if (opts.type === 'image/webp' && opts.crop === Crop.CONTAIN) {
		result = await compressByPrediction(image, fittedW, fittedH, anchorBlob.size, opts);
	}

	if (!result) {
		result = await compressByIteration(image, fittedW, fittedH, anchorBlob, opts);
	}

	if (!result) {
		throw new Error(`unable to compress image to fit ${opts.maxBytes} bytes`);
	}

	return result;
};

/**
 * pick the highest-scoring (scale, quality) cell whose predicted byte count fits the
 * budget with {@link PREDICTION_HEADROOM} to spare, encode at that cell, and return the
 * result if it actually fits. returns undefined when no cell predicts within budget or
 * when the encode missed the budget despite the prediction — callers should fall back to
 * iterative search.
 *
 * @param image decoded source image
 * @param fittedW width at scale=1.0
 * @param fittedH height at scale=1.0
 * @param anchorBytes byte count of the anchor encode at (fittedW, fittedH, MAX_QUALITY)
 * @param opts compression options
 * @returns the encoded result, or undefined if prediction was unusable
 */
const compressByPrediction = async (
	image: HTMLImageElement,
	fittedW: number,
	fittedH: number,
	anchorBytes: number,
	opts: CompressOptions,
): Promise<CompressResult | undefined> => {
	const budget = opts.maxBytes * PREDICTION_HEADROOM;

	let bestScale = 0;
	let bestQuality = 0;
	let bestScore = -Infinity;

	for (let si = 0; si < PREDICTION_SCALES.length; si++) {
		const scale = PREDICTION_SCALES[si];
		for (let qi = 0; qi < QUALITY_STEPS.length; qi++) {
			const predicted = anchorBytes * PREDICTION_RATIOS[si][qi];
			if (predicted > budget) {
				continue;
			}

			const quality = QUALITY_STEPS[qi];
			// weight pixels and quality equally — a 0.1 scale step trades against a ~9-point quality step
			const score = scale * quality;
			if (score > bestScore) {
				bestScore = score;
				bestScale = scale;
				bestQuality = quality;
			}
		}
	}

	if (bestScore === -Infinity) {
		return undefined;
	}

	const w = Math.max(1, Math.floor(fittedW * bestScale));
	const h = Math.max(1, Math.floor(fittedH * bestScale));
	const encoded = await encodeAt(image, w, h, bestQuality, opts);
	if (encoded.size <= opts.maxBytes) {
		return { blob: encoded, aspectRatio: { width: w, height: h } };
	}
	return undefined;
};

/**
 * iterative shrink-and-quality-walk search seeded with the anchor encode. used for jpeg
 * profile images (where the prediction table isn't applicable) and as a fallback when
 * the webp predictor misses its budget.
 *
 * holds quality at the ceiling while shrinking toward {@link SOFT_MIN_SCALE}, then walks
 * through {@link QUALITY_STEPS} once the soft threshold is reached. if that still isn't
 * enough it keeps shrinking down to {@link HARD_MIN_SCALE} before giving up.
 *
 * @param image decoded source image
 * @param fittedW width at scale=1.0
 * @param fittedH height at scale=1.0
 * @param anchorEncoded anchor encode at (fittedW, fittedH, MAX_QUALITY), known to overshoot
 * @param opts compression options
 * @returns the encoded result, or undefined if no attempt fits within the budget
 */
const compressByIteration = async (
	image: HTMLImageElement,
	fittedW: number,
	fittedH: number,
	anchorEncoded: Blob,
	opts: CompressOptions,
): Promise<CompressResult | undefined> => {
	const softMinW = Math.max(1, Math.floor(fittedW * SOFT_MIN_SCALE));
	const softMinH = Math.max(1, Math.floor(fittedH * SOFT_MIN_SCALE));
	const hardMinW = Math.max(1, Math.floor(fittedW * HARD_MIN_SCALE));
	const hardMinH = Math.max(1, Math.floor(fittedH * HARD_MIN_SCALE));

	let width = fittedW;
	let height = fittedH;
	let qualityIndex = 0;
	let encoded: Blob = anchorEncoded;

	// attempt 0 is the anchor; the loop runs up to MAX_ATTEMPTS - 1 additional encodes.
	for (let attempt = 1; attempt < MAX_ATTEMPTS; attempt++) {
		if (encoded.size <= opts.maxBytes) {
			return { blob: encoded, aspectRatio: { width, height } };
		}

		// overshoot: encoded byte count scales roughly with pixel count, so derive the next
		// linear scale from sqrt(target / actual). converges quickly for well-behaved images.
		const ratio = Math.sqrt((opts.maxBytes * TARGET_HEADROOM) / encoded.size);
		const canLowerQuality = qualityIndex < QUALITY_STEPS.length - 1;
		const hitSoftMin = width <= softMinW || height <= softMinH;
		const hitHardMin = width <= hardMinW || height <= hardMinH;

		if (canLowerQuality && hitSoftMin) {
			qualityIndex += 1;
		} else if (hitHardMin) {
			// at hard min with no quality headroom left — we've exhausted the search space
			return undefined;
		} else {
			const [nextW, nextH] = computeNextDims(width, height, ratio, hardMinW, hardMinH);
			if (nextW === width && nextH === height) {
				if (!canLowerQuality) {
					return undefined;
				}
				qualityIndex += 1;
			} else {
				width = nextW;
				height = nextH;
			}
		}

		encoded = await encodeAt(image, width, height, QUALITY_STEPS[qualityIndex], opts);
	}

	return encoded.size <= opts.maxBytes ? { blob: encoded, aspectRatio: { width, height } } : undefined;
};

const encodeAt = (
	image: HTMLImageElement,
	w: number,
	h: number,
	quality: number,
	opts: CompressOptions,
): Promise<Blob> => {
	const canvas = renderCanvas(image, w, h, opts.crop);
	return canvas.convertToBlob({ type: opts.type, quality: quality / 100 });
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
	if (mode === Crop.COVER) {
		return [Math.max(1, maxW), Math.max(1, maxH)];
	}

	let scale = 1;
	if (srcW > maxW || srcH > maxH) {
		scale = Math.min(maxW / srcW, maxH / srcH);
	}

	return [Math.max(1, Math.floor(srcW * scale)), Math.max(1, Math.floor(srcH * scale))];
};

const computeNextDims = (
	width: number,
	height: number,
	ratio: number,
	minW: number,
	minH: number,
): [number, number] => {
	const clampedRatio = Math.min(ratio, 0.99);
	const nextW = Math.max(minW, Math.floor(width * clampedRatio));
	const nextH = Math.max(minH, Math.floor(height * clampedRatio));

	if (nextW === width && width > minW) {
		return [width - 1, nextH];
	}
	if (nextH === height && height > minH) {
		return [nextW, height - 1];
	}
	return [nextW, nextH];
};

const renderCanvas = (img: HTMLImageElement, w: number, h: number, mode: Crop): OffscreenCanvas => {
	const canvas = new OffscreenCanvas(w, h);
	const ctx = canvas.getContext('2d');

	if (!ctx) {
		throw new Error(`failed to compress image, unable to create canvas`);
	}

	if (mode === Crop.COVER) {
		const [dx, dy, dw, dh] = cover(w, h, img.naturalWidth, img.naturalHeight);
		ctx.drawImage(img, dx, dy, dw, dh);
		return canvas;
	}

	ctx.drawImage(img, 0, 0, w, h);
	return canvas;
};
