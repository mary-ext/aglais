import { For, createSignal } from 'solid-js';

import { createGifSearchQuery, type Gif } from '~/api/queries/composer-gif';

import { useModalContext } from '~/globals/modals';

import { createDebouncedValue } from '~/lib/hooks/debounced-value';
import { modelText } from '~/lib/input-refs';

import * as Dialog from '../../dialog';
import MagnifyingGlassOutlinedIcon from '../../icons-central/magnifying-glass-outline';

export interface GifSearchDialogProps {
	onPick: (gif: GifMedia) => void;
}

const GifSearchDialog = (props: GifSearchDialogProps) => {
	const { close } = useModalContext();

	const onPick = props.onPick;

	const [search, setSearch] = createSignal('');
	const debouncedSearch = createDebouncedValue(search, 500);

	const query = createGifSearchQuery(debouncedSearch);

	return (
		<>
			<Dialog.Backdrop />
			<Dialog.Container fullHeight>
				<Dialog.Header>
					<Dialog.HeaderAccessory>
						<Dialog.Close />
					</Dialog.HeaderAccessory>

					<div class="flex grow pr-2">
						<div class="relative h-max grow">
							<div class="pointer-events-none absolute inset-y-0 ml-px grid w-10 place-items-center">
								<MagnifyingGlassOutlinedIcon class="text-lg text-contrast-muted" />
							</div>

							<input
								ref={(node) => {
									modelText(node, search, setSearch);
								}}
								type="text"
								placeholder="Search for GIFs"
								class="h-10 w-full rounded-full border border-outline-md bg-background px-3 pl-10 text-sm text-contrast outline-2 -outline-offset-2 outline-accent placeholder:text-contrast-muted focus:outline"
							/>
						</div>
					</div>
				</Dialog.Header>

				<Dialog.Body unpadded>
					<div class="grid grid-cols-3 gap-0.5">
						<For each={query.data}>
							{(gifs) => {
								return gifs.map((gif) => {
									const media = getGifMedia(gif);

									return (
										<button
											onClick={() => {
												close();
												onPick(media);
											}}
											class="aspect-square overflow-hidden bg-outline-md"
										>
											<video
												tabindex={-1}
												poster={/* @once */ media.thumbUrl}
												src={/* @once */ media.videoUrl}
												autoplay
												loop
												class="h-full w-full bg-black object-cover"
											/>
										</button>
									);
								});
							}}
						</For>
					</div>
				</Dialog.Body>
			</Dialog.Container>
		</>
	);
};

export default GifSearchDialog;

export interface GifMedia {
	embedUrl: string;
	alt: string;
	ratio: { width: number; height: number };

	videoUrl: string;
	thumbUrl: string;
}

const getGifMedia = (gif: Gif): GifMedia => {
	const media = gif.media_formats.gif;

	const dimensions = media.dims;
	const url = media.url;

	const [, id, file] = /\/([^/]+?AAAAC)\/([^/]+?)\.gif\/?$/.exec(url)!;

	return {
		embedUrl: url + `?hh=${dimensions[1]}&ww=${dimensions[0]}`,
		alt: gif.content_description,
		ratio: { width: dimensions[0], height: dimensions[1] },

		// AAAP3 -> tinywebm
		videoUrl: `https://t.gifs.bsky.app/${id.replace(/AAAAC$/, 'AAAP3')}/${file}`,
		// AAAAT -> nanogifpreview
		thumbUrl: `https://t.gifs.bsky.app/${id.replace(/AAAAC$/, 'AAAAT')}/${file}`,
	};
};
