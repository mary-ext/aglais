import { nanoid } from 'nanoid/non-secure';
import { createSignal, onCleanup } from 'solid-js';

import { globalEvents } from '~/globals/events';

import PauseSolidIcon from '~/components/icons-central/pause-solid';
import PlaySolidIcon from '~/components/icons-central/play-solid';

import type { BlueskyGifSnippet } from '../lib/snippet';

export interface GifPlayerProps {
	/** Expected to be static */
	snippet: BlueskyGifSnippet;
}

const GifPlayer = ({ snippet }: GifPlayerProps) => {
	const playerId = nanoid();

	const [playing, setPlaying] = createSignal(true);
	const [stalling, setStalling] = createSignal(false);

	let _stallTimeout: number | undefined;

	onCleanup(() => clearTimeout(_stallTimeout));

	return (
		<div class="contents">
			<video
				ref={(node) => {
					onCleanup(
						globalEvents.on('mediaplay', (id) => {
							if (id !== playerId && !node.paused) {
								node.pause();
							}
						}),
					);
				}}
				aria-description={/* @once */ snippet.description}
				src={/* @once */ snippet.url}
				poster={/* @once */ snippet.thumb}
				autoplay={/* @once */ playing()}
				muted
				loop
				playsinline
				onClick={(ev) => {
					const video = ev.currentTarget;

					ev.preventDefault();

					if (video.paused) {
						video.play();
					} else {
						video.pause();
					}
				}}
				onPlay={() => {
					setPlaying(true);
					globalEvents.emit('mediaplay', playerId);
				}}
				onPause={() => setPlaying(false)}
				onWaiting={() => {
					clearTimeout(_stallTimeout);
					_stallTimeout = setTimeout(() => setStalling(true), 50);
				}}
				onPlaying={() => {
					clearTimeout(_stallTimeout);
					setStalling(false);
				}}
				class="h-full w-full cursor-pointer"
			/>

			<div
				class="pointer-events-none absolute inset-0 grid place-items-center bg-black/50 transition-opacity duration-75"
				style={{ opacity: '' + +stalling() }}
			>
				<svg viewBox="0 0 32 32" class="h-8 w-8 animate-spin">
					<circle cx="16" cy="16" fill="none" r="14" stroke-width="4" class="stroke-p-neutral-950/20" />
					<circle
						cx="16"
						cy="16"
						fill="none"
						r="14"
						stroke-width="4"
						stroke-dasharray="80px"
						stroke-dashoffset="60px"
						class="stroke-white"
					/>
				</svg>
			</div>

			<div class="pointer-events-none absolute bottom-0 right-0 m-2 flex gap-0.5 overflow-hidden rounded">
				<div class="flex h-4 items-center bg-p-neutral-950/60 px-1 text-[9px] font-bold tracking-wider text-white">
					GIF
				</div>

				<div class="flex h-4 items-center bg-p-neutral-950/60 px-1 text-[9px] font-bold tracking-wider text-white">
					{(() => {
						const Icon = playing() ? PauseSolidIcon : PlaySolidIcon;
						return <Icon />;
					})()}
				</div>
			</div>
		</div>
	);
};

export default GifPlayer;
