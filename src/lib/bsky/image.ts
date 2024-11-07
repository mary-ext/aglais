import { remove as removeExif } from '@mary/exif-rm';

const MAX_SIZE = 1_000_000; // 1 MB

const POST_MAX_HEIGHT = 2_000;
const POST_MAX_WIDTH = 2_000;

export interface CompressResult {
	blob: Blob;
	ratio: {
		width: number;
		height: number;
	};
}

export const compressPostImage = async (blob: Blob): Promise<CompressResult> => {
	// Try removing EXIF on supported image formats
	{
		const exifRemoved = removeExif(new Uint8Array(await blob.arrayBuffer()));
		if (exifRemoved !== null) {
			blob = new Blob([exifRemoved], { type: blob.type });
		}
	}

	// Read the image to get its metadata
	const image = await getImageFromBlob(blob);

	if (blob.size <= MAX_SIZE) {
		return { blob: blob, ratio: { width: image.naturalWidth, height: image.naturalHeight } };
	}

	// We went over the maximum size, resize and compress to fit.
	const [canvas, width, height] = getResizedImage(image, POST_MAX_WIDTH, POST_MAX_HEIGHT, Crop.CONTAIN);

	let low = 70;
	let high = 100;

	let last: CompressResult | undefined;

	while (low <= high) {
		const q = Math.floor((low + high) / 2);

		const blob = await canvas.convertToBlob({
			type: 'image/webp',
			quality: q / 100,
		});

		const result: CompressResult = {
			blob: blob,
			ratio: { width: width, height: height },
		};

		if (blob.size === MAX_SIZE) {
			return result;
		} else if (blob.size < MAX_SIZE) {
			// Try higher quality
			low = q + 1;
			last = result;
		} else {
			// Try lower quality
			high = q - 1;
		}
	}

	if (last) {
		return last;
	}

	throw new Error(`Unable to compress image according to criteria`);
};

export const compressProfileImage = async (
	blob: Blob,
	maxW: number,
	maxH: number,
): Promise<CompressResult> => {
	// Try removing EXIF on supported image formats
	{
		const exifRemoved = removeExif(new Uint8Array(await blob.arrayBuffer()));

		if (exifRemoved !== null) {
			blob = new Blob([exifRemoved], { type: blob.type });
		}
	}

	const image = await getImageFromBlob(blob);
	const type = blob.type;

	// Profile avatars only accepts either JPEG or PNG
	if ((type === 'image/jpeg' || type === 'image/png') && blob.size <= MAX_SIZE) {
		return { blob: blob, ratio: { width: image.naturalWidth, height: image.naturalHeight } };
	}

	// We went over the maximum size or format is unsupported, resize and compress to fit.
	const [canvas, width, height] = getResizedImage(image, maxW, maxH, Crop.COVER);

	let low = 70;
	let high = 100;

	let last: CompressResult | undefined;

	while (low <= high) {
		const q = Math.floor((low + high) / 2);

		const blob = await canvas.convertToBlob({
			// Profile avatars and banners only accepts PNG and JPEG
			type: 'image/jpeg',
			quality: q / 100,
		});

		const result: CompressResult = {
			blob: blob,
			ratio: { width: width, height: height },
		};

		if (blob.size === MAX_SIZE) {
			return result;
		} else if (blob.size < MAX_SIZE) {
			// Try higher quality
			low = q + 1;
			last = result;
		} else {
			// Try lower quality
			high = q - 1;
		}
	}

	if (last) {
		return last;
	}

	throw new Error(`Unable to compress image according to criteria`);
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

export const enum Crop {
	CONTAIN,
	COVER,
}

export const getResizedImage = (img: HTMLImageElement, maxW: number, maxH: number, mode: Crop) => {
	let scale = 1;
	let w = img.naturalWidth;
	let h = img.naturalHeight;

	if (w > maxW || h > maxH) {
		if (mode === Crop.COVER) {
			scale = w < h ? maxW / w : maxH / h;
		} else if (mode === Crop.CONTAIN) {
			scale = w > h ? maxW / w : maxH / h;
		}

		w = Math.floor(w * scale);
		h = Math.floor(h * scale);
	}

	const canvas = new OffscreenCanvas(w, h);
	const ctx = canvas.getContext('2d');

	if (!ctx) {
		throw new Error(`Failed to compress image, unable to create canvas`);
	}

	ctx.drawImage(img, 0, 0, w, h);

	return [canvas, w, h] as const;
};
