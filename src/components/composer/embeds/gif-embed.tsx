import { openModal } from '~/globals/modals';

import AltButton from '../../alt-button';
import { type BlueskyGifSnippet, SnippetType } from '../../embeds/lib/snippet';
import { GifEmbed as GifEmbedContent } from '../../embeds/supports/gif-embed';
import IconButton from '../../icon-button';
import CrossLargeOutlinedIcon from '../../icons-central/cross-large-outline';
import Keyed from '../../keyed';
import GifAltDialogLazy from '../dialogs/gif-alt-dialog-lazy';
import type { PostGifEmbed } from '../lib/state';

export interface GifEmbedProps {
	embed: PostGifEmbed;
	active: boolean;
	onRemove: () => void;
}

const GifEmbed = (props: GifEmbedProps) => {
	return (
		<div class="relative w-min max-w-full self-start">
			<Keyed value={props.embed.gif}>
				{(gif) => {
					const snippet: BlueskyGifSnippet = {
						type: SnippetType.BLUESKY_GIF,
						url: gif.videoUrl,
						thumb: gif.thumbUrl,
						ratio: `${gif.ratio.width}/${gif.ratio.height}`,
						get description() {
							return props.embed.alt ?? gif.alt;
						},
					};

					return <GifEmbedContent snippet={snippet} disabled={!props.active} />;
				}}
			</Keyed>

			<div hidden={!props.active} class="absolute right-0 top-0 p-1">
				<IconButton
					icon={CrossLargeOutlinedIcon}
					title="Remove this embed"
					variant="black"
					size="sm"
					onClick={props.onRemove}
				/>
			</div>

			<div class="absolute bottom-0 left-0 p-2">
				<AltButton
					title="Add GIF description..."
					checked={props.embed.alt !== undefined}
					onClick={() => {
						openModal(() => (
							<GifAltDialogLazy
								gif={props.embed.gif}
								value={props.embed.alt}
								onChange={(next) => {
									props.embed.alt = next;
								}}
							/>
						));
					}}
				/>
			</div>
		</div>
	);
};

export default GifEmbed;
