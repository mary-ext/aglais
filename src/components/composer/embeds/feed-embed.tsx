import { Match, Switch } from 'solid-js';

import { createFeedMetaQuery } from '~/api/queries/feed';

import CircularProgress from '~/components/circular-progress';
import FeedEmbedContent from '~/components/embeds/feed-embed';
import IconButton from '~/components/icon-button';
import CrossLargeOutlinedIcon from '~/components/icons-central/cross-large-outline';

import type { PostFeedEmbed } from '../lib/state';

export interface FeedEmbedProps {
	embed: PostFeedEmbed;
	active: boolean;
	onRemove: () => void;
}

const FeedEmbed = (props: FeedEmbedProps) => {
	const query = createFeedMetaQuery(() => props.embed.uri);

	return (
		<div class="relative">
			<Switch>
				<Match when={query.data} keyed>
					{(data) => {
						return <FeedEmbedContent feed={data} />;
					}}
				</Match>

				<Match when>
					<div class="grid place-items-center rounded border border-outline p-4">
						<CircularProgress />
					</div>
				</Match>
			</Switch>

			<div hidden={!props.active} class="absolute right-0 top-0 p-1">
				<IconButton
					icon={CrossLargeOutlinedIcon}
					title="Remove this embed"
					size="sm"
					onClick={props.onRemove}
				/>
			</div>
		</div>
	);
};

export default FeedEmbed;
