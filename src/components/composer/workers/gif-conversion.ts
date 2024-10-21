import { expose } from 'comlink';
import { ArrayBufferTarget, Muxer } from 'webm-muxer';

export type GifWorkerApi = typeof api;
const api = {
	async transform(blob: Blob) {
		const decoder = new ImageDecoder({ type: 'image/gif', data: await blob.arrayBuffer() });
		await decoder.tracks.ready;

		const frameCount = decoder.tracks.selectedTrack!.frameCount;

		let muxer: Muxer<ArrayBufferTarget>;
		let encoder: VideoEncoder | undefined;

		if (frameCount === 0) {
			throw new Error(`GIF has no frames`);
		}

		for (let idx = 0, configured = false; idx < frameCount; idx++) {
			const { image } = await decoder.decode({ frameIndex: idx });

			if (!configured) {
				const width = image.displayWidth;
				const height = image.displayHeight;

				configured = true;

				muxer = new Muxer({
					target: new ArrayBufferTarget(),
					video: { codec: 'V_VP9', width, height },
				});

				encoder = new VideoEncoder({
					output: (chunk) => muxer.addVideoChunk(chunk),
					error: (err) => console.error(err),
				});

				encoder.configure({ codec: 'vp09.00.10.08', width, height });
			}

			encoder!.encode(image);
		}

		await encoder!.flush();
		muxer!.finalize();

		const buffer = muxer!.target.buffer;
		return new Blob([buffer], { type: 'video/webm' });
	},
};

expose(api);
