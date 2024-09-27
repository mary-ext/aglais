import type { AppBskyEmbedImages } from '@atcute/client/lexicons';

const clamp = (value: number, min: number, max: number): number => {
	return Math.max(min, Math.min(max, value));
};

export const getAspectRatio = (image: AppBskyEmbedImages.ViewImage): number => {
	const dims = image.aspectRatio;

	const width = dims ? dims.width : 1;
	const height = dims ? dims.height : 1;
	const ratio = width / height;

	return ratio;
};

export const clampBetween3_4And4_3 = (ratio: number): number => {
	return clamp(ratio, 3 / 4, 4 / 3);
};

export const clampBetween9_16And16_9 = (ratio: number): number => {
	return clamp(ratio, 9 / 16, 16 / 9);
};

export const clampBetween3_4And16_9 = (ratio: number): number => {
	return clamp(ratio, 3 / 4, 16 / 9);
};
