export const getVideoAspectRatio = (blob: Blob): Promise<{ width: number; height: number }> => {
	return new Promise((resolve, reject) => {
		const video = document.createElement('video');
		const blobUrl = URL.createObjectURL(blob);

		const cleanup = () => {
			URL.revokeObjectURL(blobUrl);
		};

		video.preload = 'metadata';
		video.src = blobUrl;

		video.onloadedmetadata = () => {
			cleanup();
			resolve({ width: video.videoWidth, height: video.videoHeight });
		};
		video.onerror = (_ev, _source, _lineno, _colno, error) => {
			cleanup();
			reject(new Error(`failed to grab video aspect ratio`, { cause: error }));
		};
	});
};
