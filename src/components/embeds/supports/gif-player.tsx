import { createEffect, createSignal } from 'solid-js';

import CircularProgress from '~/components/circular-progress';
import PlaySolidIcon from '~/components/icons-central/play-solid';

import type { BlueskyGifSnippet } from '../lib/snippet';

export interface GifPlayerProps {
	snippet: BlueskyGifSnippet;
	disabled?: boolean;
}

export const GifPlayer = (props: GifPlayerProps) => {
	const snippet = props.snippet;

	const [playing, setPlaying] = createSignal(false);
	const [stalling, setStalling] = createSignal(false);

	const isPlaying = () => playing() && !props.disabled;

	let _stallTimeout: number | undefined;

	return (
		<div
			class="relative max-h-80 max-w-full self-start overflow-hidden rounded-md border border-outline"
			style={/* @once */ { 'aspect-ratio': snippet.ratio }}
		>
			<video
				ref={(node) => {
					createEffect(() => {
						if (isPlaying()) {
							node.play();
						} else if (!node.paused) {
							node.pause();
							node.currentTime = 0;
						}
					});
				}}
				tabindex={-1}
				poster={/* @once */ snippet.thumb}
				src={/* @once */ snippet.url}
				loop
				muted
				onWaiting={() => {
					clearTimeout(_stallTimeout);
					_stallTimeout = setTimeout(() => setStalling(true), 50);
				}}
				onPlaying={() => {
					clearTimeout(_stallTimeout);
					setStalling(false);
				}}
				class="h-full w-full"
			/>

			{/* FIXME: this is the same hack as standalone images in image embeds */}
			<div class="h-screen w-screen"></div>

			<div hidden={!(!isPlaying() || stalling())} class="absolute inset-0 bg-black/50"></div>

			<button
				hidden={props.disabled}
				title={!playing() ? 'Play GIF' : `Pause GIF`}
				aria-description={snippet.description}
				onClick={() => setPlaying(!playing())}
				class="absolute inset-0 grid place-items-center rounded-md outline-2 -outline-offset-2 outline-white focus-visible:outline"
			>
				{!playing() ? (
					<div class="grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-accent">
						<PlaySolidIcon class="text-sm" />
					</div>
				) : stalling() ? (
					<CircularProgress size={32} />
				) : null}
			</button>
		</div>
	);
};
