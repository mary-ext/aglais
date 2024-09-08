import { Show, Suspense, createRenderEffect, createSignal, lazy } from 'solid-js';

import CircularProgress from '~/components/circular-progress';
import PlaySolidIcon from '~/components/icons-central/play-solid';

import type { BlueskyGifSnippet } from '../lib/snippet';

const GifPlayer = lazy(() => import('../players/gif-player'));

export interface GifEmbedProps {
	/** Expected to be static */
	snippet: BlueskyGifSnippet;
	disabled?: boolean;
}

export const GifEmbed = (props: GifEmbedProps) => {
	const snippet = props.snippet;

	const [loaded, setLoaded] = createSignal(false);

	if ('disabled' in props) {
		createRenderEffect(() => {
			if (props.disabled) {
				setLoaded(false);
			}
		});
	}

	return (
		<div
			class="relative max-h-80 max-w-full self-start overflow-hidden rounded-md border border-outline"
			style={/* @once */ { 'aspect-ratio': snippet.ratio }}
		>
			<Show
				when={loaded()}
				fallback={
					<button
						title="Play GIF"
						aria-description={/* @once */ snippet.description}
						disabled={props.disabled}
						onClick={() => setLoaded(true)}
						class="h-full w-full"
					>
						<img src={/* @once */ snippet.thumb} class="h-full w-full object-contain" />

						<div
							hidden={props.disabled}
							class="absolute left-1/2 top-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-p-neutral-700/60 p-3 hover:bg-p-neutral-700/80"
						>
							<PlaySolidIcon class="text-xl" />
						</div>

						<div class="pointer-events-none absolute bottom-0 right-0 m-2 flex gap-0.5 overflow-hidden rounded">
							<div class="flex h-4 items-center bg-p-neutral-950/60 px-1 text-[9px] font-bold tracking-wider text-white">
								GIF
							</div>
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
					<GifPlayer snippet={snippet} />
				</Suspense>
			</Show>

			{/* FIXME: this is the same hack as standalone images in image embeds */}
			<div class="h-screen w-screen"></div>
		</div>
	);
};
