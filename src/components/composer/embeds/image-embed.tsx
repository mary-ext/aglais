import { For, onCleanup } from 'solid-js';

import { openModal } from '~/globals/modals';

import AltButton from '../../alt-button';
import IconButton from '../../icon-button';
import CrossLargeOutlinedIcon from '../../icons-central/cross-large-outline';
import ImageAltDialogLazy from '../dialogs/image-alt-dialog-lazy';
import type { PostImageEmbed } from '../lib/state';

import type { BaseEmbedProps } from './types';

export interface ImageEmbedProps extends BaseEmbedProps {
	embed: PostImageEmbed;
}

const ImageEmbed = (props: ImageEmbedProps) => {
	return (
		<div
			tabindex={!props.active ? -1 : undefined}
			class="-ml-16 -mr-4 flex snap-x snap-mandatory gap-2 overflow-x-auto pl-16 pr-4 scrollbar-hide"
		>
			<For each={props.embed.images}>
				{(image, index) => {
					const thumbUrl = URL.createObjectURL(image.blob);
					onCleanup(() => URL.revokeObjectURL(thumbUrl));

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
											props.dispatch({ type: 'remove_media' });
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
												image={image.blob}
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
