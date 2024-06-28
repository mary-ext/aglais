import { createEffect, createSignal } from 'solid-js';

import type { AppBskyEmbedExternal } from '@mary/bluesky-client/lexicons';

import { safeUrlParse } from '~/api/utils/strings';

import CircularProgress from '../circular-progress';
import PlaySolidIcon from '../icons-central/play-solid';

import { SnippetType, detectSnippet } from './lib/snippet';
import { on } from '~/lib/misc';

export interface ExternalEmbedProps {
	/** Expected to be static */
	embed: AppBskyEmbedExternal.View;
	/** Expected to be static */
	interactive?: boolean;
}

const ExternalEmbed = ({ embed, interactive }: ExternalEmbedProps) => {
	const { title, uri, thumb } = embed.external;

	const url = safeUrlParse(uri);
	const domain = trimDomain(url?.host ?? '');

	const snippet = detectSnippet(embed.external);
	const type = snippet.type;

	if (interactive && type === SnippetType.BLUESKY_GIF) {
		const [playing, setPlaying] = createSignal(false);
		const [stalling, setStalling] = createSignal(false);

		let _stallTimeout: number | undefined;

		return (
			<div
				class="relative max-h-80 max-w-full self-start overflow-hidden rounded-md border border-outline"
				style={/* @once */ { 'aspect-ratio': snippet.ratio }}
			>
				<video
					ref={(node) => {
						createEffect(() => {
							if (playing()) {
								node.play();
							} else if (!node.paused) {
								node.pause();
								node.currentTime = 0;
							}
						});
					}}
					tabindex={-1}
					poster={thumb}
					src={/* @once */ snippet.url}
					loop
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

				<div hidden={!(!playing() || stalling())} class="absolute inset-0 bg-black/50"></div>

				<button
					title={!playing() ? 'Play GIF' : `Pause GIF`}
					aria-description={/* @once */ snippet.description}
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
	}

	if (interactive && type === SnippetType.IFRAME) {
		const [show, setShow] = createSignal(false);

		return on(show, (isShowing) => {
			if (isShowing) {
				return (
					<div
						class="overflow-hidden rounded-md border border-outline"
						style={/* @once */ { 'aspect-ratio': snippet.ratio }}
					>
						<iframe src={/* @once */ snippet.url} allow="autoplay; fullscreen" class="h-full w-full" />
					</div>
				);
			}

			return (
				<div class="flex overflow-hidden rounded-md border border-outline">
					<button
						onClick={() => setShow(true)}
						class="relative aspect-square w-[86px] shrink-0 border-r border-outline"
					>
						{thumb && <img src={thumb} class="h-full w-full object-cover" />}

						<div class="absolute inset-0 grid place-items-center">
							<div class="grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-accent">
								<PlaySolidIcon class="text-sm" />
							</div>
						</div>
					</button>

					<a
						href={uri}
						target="_blank"
						rel="noopener noreferrer nofollow"
						class="flex min-w-0 flex-col justify-center gap-0.5 p-3 text-sm hover:bg-contrast/sm active:bg-contrast/sm-pressed"
					>
						<p class="overflow-hidden text-ellipsis text-contrast-muted empty:hidden">{domain}</p>
						<p class="line-clamp-2 break-words font-medium empty:hidden">{title}</p>
					</a>
				</div>
			);
		});
	}

	return (
		<a
			href={interactive ? uri : undefined}
			target="_blank"
			rel="noopener noreferrer nofollow"
			class={
				`flex overflow-hidden rounded-md border border-outline` +
				(interactive ? ` hover:bg-contrast/sm active:bg-contrast/sm-pressed` : ``)
			}
		>
			{thumb && (
				<img src={thumb} class="aspect-square w-[86px] shrink-0 border-r border-outline object-cover" />
			)}

			<div class="flex min-w-0 flex-col justify-center gap-0.5 p-3 text-sm">
				<p class="overflow-hidden text-ellipsis text-contrast-muted empty:hidden">{domain}</p>
				<p class="line-clamp-2 break-words font-medium empty:hidden">{title}</p>
			</div>
		</a>
	);
};

export default ExternalEmbed;

const trimDomain = (host: string) => {
	return host.startsWith('www.') ? host.slice(4) : host;
};
