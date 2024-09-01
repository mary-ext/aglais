import { createSignal, lazy, Show, Suspense } from 'solid-js';

import type { AppBskyEmbedDefs, AppBskyEmbedVideo } from '@atcute/client/lexicons';

import CircularProgress from '../circular-progress';
import PlaySolidIcon from '../icons-central/play-solid';

const VideoPlayer = lazy(() => import('./players/video-player'));

export interface VideoEmbedProps {
	/** Expected to be static */
	embed: AppBskyEmbedVideo.View;
	blur?: boolean;
	/** Expected to be static */
	borderless?: boolean;
	/** Expected to be static */
	standalone?: boolean;
	/** Expected to be static */
	interactive?: boolean;
}

const VideoEmbed = (props: VideoEmbedProps) => {
	const { embed, borderless, standalone, interactive } = props;

	const [loaded, setLoaded] = createSignal(false);

	const isStandaloneVideo = standalone && embed.aspectRatio !== undefined;

	let ratio: string | undefined;
	let cn: string | undefined;

	if (isStandaloneVideo) {
		cn = `max-h-80 min-h-16 min-w-16 max-w-full overflow-hidden`;
		ratio = constructRatio(embed.aspectRatio!);
	} else {
		cn = `aspect-video overflow-hidden`;
	}

	return (
		<div
			class={
				`relative bg-background` +
				(!borderless ? ` overflow-hidden rounded-md border border-outline` : ``) +
				(isStandaloneVideo ? ` max-w-full self-start` : ``)
			}
		>
			<div class={cn} style={{ 'aspect-ratio': ratio }}>
				{!interactive ? (
					<img
						alt={/* @once */ embed.alt}
						src={/* @once */ embed.thumbnail}
						class="h-full w-full object-contain"
					/>
				) : (
					<Show
						when={loaded()}
						fallback={
							<button
								title="Play video"
								aria-description={/* @once */ embed.alt}
								onClick={() => setLoaded(true)}
								class="h-full w-full"
							>
								<img src={/* @once */ embed.thumbnail} class="h-full w-full object-contain" />

								<div class="absolute left-1/2 top-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-p-neutral-700/60 p-3 hover:bg-p-neutral-700/80">
									<PlaySolidIcon class="text-xl" />
								</div>
							</button>
						}
					>
						<Suspense
							fallback={
								<div class="grid h-full w-full place-items-center">
									<CircularProgress />
								</div>
							}
						>
							<VideoPlayer embed={embed} />
						</Suspense>
					</Show>
				)}

				{/* Hack */}
				<div hidden={!standalone} class="h-screen w-screen"></div>
			</div>
		</div>
	);
};

export default VideoEmbed;

const constructRatio = (aspectRatio: AppBskyEmbedDefs.AspectRatio): string => {
	return `${aspectRatio.width}/${aspectRatio.height}`;
};
