import Hls from 'hls.js';
import { onCleanup } from 'solid-js';

import type { AppBskyEmbedVideo } from '@atcute/client/lexicons';

export interface VideoPlayerProps {
	/** Expected to be static */
	embed: AppBskyEmbedVideo.View;
}

const VideoPlayer = ({ embed }: VideoPlayerProps) => {
	const hls = new Hls({ capLevelToPlayerSize: true });
	onCleanup(() => hls.destroy());

	hls.loadSource(embed.playlist);

	return (
		<div class="contents">
			<video
				ref={(node) => {
					hls.attachMedia(node);
				}}
				aria-description={/* @once */ embed.alt}
				controls
				playsinline
				autoplay
				class="h-full w-full"
			/>
		</div>
	);
};

export default VideoPlayer;
