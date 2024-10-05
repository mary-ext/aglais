import Hls from 'hls.js';
import { nanoid } from 'nanoid/non-secure';
import { createEffect, createSignal, onCleanup } from 'solid-js';

import type { AppBskyEmbedVideo } from '@atcute/client/lexicons';

import { globalEvents } from '~/globals/events';

import { replaceVideoCdnUrl } from '~/lib/bsky/video';

export interface VideoPlayerProps {
	/** Expected to be static */
	embed: AppBskyEmbedVideo.View;
}

const VideoPlayer = ({ embed }: VideoPlayerProps) => {
	const [playing, setPlaying] = createSignal(false);
	const playerId = nanoid();

	const hls = new Hls({
		capLevelToPlayerSize: true,
		startLevel: 1,
		xhrSetup(xhr, urlString) {
			const url = new URL(urlString);

			// Just in case it fails, we'll remove `session_id` everywhere
			url.searchParams.delete('session_id');

			xhr.open('get', url.toString());
		},
	});

	onCleanup(() => hls.destroy());

	hls.loadSource(replaceVideoCdnUrl(embed.playlist));

	return (
		<div class="contents">
			<video
				ref={(node) => {
					hls.attachMedia(node);
					node.volume = 0.25;

					createEffect(() => {
						if (!playing()) {
							return;
						}

						const observer = new IntersectionObserver(
							(entries) => {
								const entry = entries[0];
								if (!entry.isIntersecting) {
									node.pause();
								}
							},
							{ threshold: 0.5 },
						);

						onCleanup(() => observer.disconnect());
						onCleanup(globalEvents.on('mediaplay', () => node.pause()));

						observer.observe(node);
					});
				}}
				poster={/* @once */ embed.thumbnail && replaceVideoCdnUrl(embed.thumbnail)}
				aria-description={/* @once */ embed.alt}
				controls
				playsinline
				autoplay
				onPlay={() => {
					globalEvents.emit('mediaplay', playerId);
					setPlaying(true);
				}}
				onPause={() => {
					setPlaying(false);
				}}
				class="h-full w-full"
			/>
		</div>
	);
};

export default VideoPlayer;
