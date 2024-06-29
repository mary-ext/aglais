import IconButton from '~/components/icon-button';
import CrossLargeOutlinedIcon from '~/components/icons-central/cross-large-outline';
import Keyed from '~/components/keyed';

import AltButton from '~/components/alt-button';
import { GifPlayer } from '~/components/embeds/external-embed';
import { SnippetType, type BlueskyGifSnippet } from '~/components/embeds/lib/snippet';

import type { PostGifEmbed } from '../lib/state';
import type { BaseEmbedProps } from './types';

export interface GifEmbedProps extends BaseEmbedProps {
	embed: PostGifEmbed;
}

const GifEmbed = (props: GifEmbedProps) => {
	const onRemove = () => props.dispatch({ type: 'remove_media' });

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

					return <GifPlayer snippet={snippet} disabled={!props.active} />;
				}}
			</Keyed>

			<div hidden={!props.active} class="absolute right-0 top-0 p-1">
				<IconButton
					icon={CrossLargeOutlinedIcon}
					title="Remove this embed"
					variant="black"
					size="sm"
					onClick={onRemove}
				/>
			</div>

			<div class="absolute bottom-0 left-0 p-2">
				<AltButton title="Add GIF description..." checked={props.embed.alt !== undefined} />
			</div>
		</div>
	);
};

export default GifEmbed;
