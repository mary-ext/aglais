import { getImageFromBlob } from '../bsky/image';

export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_ORIGINAL_SIZE = 1000000;
export const MAX_BLOB_SIZE = 262144;

export const EMOTE_SIZE = 128;

export type Crop = 'cover' | 'contain';

export const getCompressedEmotes = async (original: Blob, crop: Crop) => {
	const image = await getImageFromBlob(original);

	return {
		png_128: await compressIfNeeded(image, original, 'image/png', crop),
		webp_128: await compressIfNeeded(image, original, 'image/webp', crop),
	};
};

const compressIfNeeded = async (image: HTMLImageElement, blob: Blob, type: string, crop: Crop) => {
	const typ = blob.type;

	if (
		typ === type &&
		blob.size <= MAX_BLOB_SIZE &&
		image.naturalWidth <= EMOTE_SIZE &&
		image.naturalWidth === image.naturalHeight
	) {
		return blob;
	}

	const [canvas, width, height] = getResizedImage(image, EMOTE_SIZE, crop);
	const large = blob.size > 1_500_000;

	// Start at 90% if we're over 1.5 MB because it's unlikely 100% will work.
	for (let q = large ? 90 : 100; q >= 70; q -= 10) {
		const result = await canvas.convertToBlob({
			type: type,
			quality: q / 100,
		});

		if (result.size <= MAX_BLOB_SIZE) {
			return result;
		}
	}

	throw new Error(`unable to compress image according to criteria`);
};

const getResizedImage = (img: HTMLImageElement, maxD: number, mode: Crop) => {
	let scale = 1;
	let w = img.naturalHeight;
	let h = img.naturalWidth;

	{
		const idealSize = Math.min(maxD, Math.max(w, h));

		if (mode === 'cover') {
			scale = w < h ? idealSize / w : idealSize / h;
		} else if (mode === 'contain') {
			scale = w > h ? idealSize / w : idealSize / h;
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
