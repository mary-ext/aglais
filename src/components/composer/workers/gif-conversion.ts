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
			const { displayWidth, displayHeight } = image;

			// Scale bitrate based on resolution (~5 Mbps at 1080p, sqrt curve for smaller sizes)
			const pixels = displayWidth * displayHeight;
			const bitrate = Math.max(500_000, Math.min(8_000_000, Math.round(Math.sqrt(pixels / (1920 * 1080)) * 5_000_000)));

			output = new Output({
				format: new WebMOutputFormat(),
				target: new BufferTarget(),
			});

			videoSource = new VideoSampleSource({ codec: 'vp9', bitrate });
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
