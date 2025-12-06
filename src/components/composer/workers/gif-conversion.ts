import { expose } from 'comlink';
import { BufferTarget, Output, VideoSample, VideoSampleSource, WebMOutputFormat } from 'mediabunny';

export type GifWorkerApi = typeof api;
const api = {
	async transform(blob: Blob) {
		const decoder = new ImageDecoder({ type: 'image/gif', data: await blob.arrayBuffer() });
		await decoder.tracks.ready;

		const frameCount = decoder.tracks.selectedTrack!.frameCount;

		if (frameCount === 0) {
			throw new Error(`GIF has no frames`);
		}

		let output: Output<WebMOutputFormat, BufferTarget>;
		let videoSource: VideoSampleSource;

		{
			const { image } = await decoder.decode({ frameIndex: 0 });

			output = new Output({
				format: new WebMOutputFormat(),
				target: new BufferTarget(),
			});

			videoSource = new VideoSampleSource({ codec: 'vp9', bitrate: 1e6 });
			output.addVideoTrack(videoSource);

			await output.start();
			await videoSource.add(new VideoSample(image));
		}

		for (let idx = 1; idx < frameCount; idx++) {
			const { image } = await decoder.decode({ frameIndex: idx });
			await videoSource.add(new VideoSample(image));
		}

		await output.finalize();

		const buffer = output.target.buffer!;
		return new Blob([buffer], { type: 'video/webm' });
	},
};

expose(api);
