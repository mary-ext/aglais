import { onCleanup } from 'solid-js';

export const SUPPORTED_IMAGE_FORMATS = ['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/gif'];
export const SUPPORTED_VIDEO_FORMATS = ['video/mp4', 'video/webm', 'video/mpeg', 'video/quicktime'];

export const convertBlobToUrl = (blob: Blob | string): string => {
	if (typeof blob === 'string') {
		return blob;
	}

	const blobUrl = URL.createObjectURL(blob);
	onCleanup(() => URL.revokeObjectURL(blobUrl));

	return blobUrl;
};

export const openImagePicker = (callback: (files: File[]) => void, multiple: boolean) => {
	const input = document.createElement('input');

	input.type = 'file';
	input.multiple = multiple;
	input.accept = SUPPORTED_IMAGE_FORMATS.join(',');
	input.oninput = () => callback(Array.from(input.files!));

	input.click();
};

export const openMediaPicker = (callback: (files: File[]) => void, multiple: boolean) => {
	const input = document.createElement('input');

	input.type = 'file';
	input.multiple = multiple;
	input.accept = [...SUPPORTED_IMAGE_FORMATS, ...SUPPORTED_VIDEO_FORMATS].join(',');
	input.oninput = () => callback(Array.from(input.files!));

	input.click();
};
