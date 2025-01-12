import { For, onCleanup } from 'solid-js';

import { openModal } from '~/globals/modals';

import { useSession } from '~/lib/states/session';

import AltButton from '../../alt-button';
import IconButton from '../../icon-button';
import CrossLargeOutlinedIcon from '../../icons-central/cross-large-outline';
import ImageAltDialogLazy from '../dialogs/image-alt-dialog-lazy';
import type { PostImageEmbed } from '../lib/state';

export interface ImageEmbedProps {
	embed: PostImageEmbed;
	active: boolean;
	onRemove: () => void;
}

const ImageEmbed = (props: ImageEmbedProps) => {
	const { currentAccount } = useSession();

	return (
		<div
			tabindex={!props.active ? -1 : undefined}
			class="-ml-16 -mr-4 flex snap-x snap-mandatory gap-2 overflow-x-auto pl-16 pr-4 scrollbar-hide"
		>
			<For each={props.embed.images}>
				{(image, index) => {
					const source = image.source;

					let thumbUrl: string;

					switch (source.type) {
						case 'local': {
							onCleanup(() => URL.revokeObjectURL(thumbUrl));

							thumbUrl = URL.createObjectURL(source.blob);
							break;
						}
						case 'remote': {
							const did = currentAccount!.did;
							const cid = source.blob.ref.$link;

							thumbUrl = `https://cdn.bsky.app/img/feed_fullsize/plain/${did}/${cid}@png`;
							break;
						}
					}

					return (
						<div class="relative shrink-0 snap-end snap-always scroll-m-4 overflow-hidden rounded border border-outline">
							<img src={thumbUrl} class="h-32 w-32 object-cover" />

							<div hidden={!props.active} class="absolute right-0 top-0 p-1">
								<IconButton
									icon={CrossLargeOutlinedIcon}
									title="Remove this image"
									variant="black"
									size="sm"
									onClick={() => {
										const images = props.embed.images;

										if (images.length === 1) {
											props.onRemove();
										} else {
											images.splice(index(), 1);
										}
									}}
								/>
							</div>

							<div class="absolute bottom-0 left-0 p-2">
								<AltButton
									title="Add image description..."
									checked={image.alt !== ''}
									onClick={() => {
										openModal(() => (
											<ImageAltDialogLazy
												source={image.source}
												value={image.alt}
												onChange={(next) => {
													image.alt = next;
												}}
											/>
										));
									}}
								/>
							</div>
						</div>
					);
				}}
			</For>
		</div>
	);
};

export default ImageEmbed;
