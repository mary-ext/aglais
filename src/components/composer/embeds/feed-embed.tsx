import { Match, Switch } from 'solid-js';

import { createFeedMetaQuery } from '~/api/queries/feed';

import CircularProgress from '~/components/circular-progress';
import IconButton from '~/components/icon-button';
import CrossLargeOutlinedIcon from '~/components/icons-central/cross-large-outline';

import FeedEmbedContent from '~/components/embeds/feed-embed';

import type { PostFeedEmbed } from '../lib/state';
import type { BaseEmbedProps } from './types';

export interface FeedEmbedProps extends BaseEmbedProps {
	embed: PostFeedEmbed;
}

const FeedEmbed = (props: FeedEmbedProps) => {
	const query = createFeedMetaQuery(() => props.embed.uri);

	const onRemove = () => props.dispatch({ type: 'remove_record' });

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
				<IconButton icon={CrossLargeOutlinedIcon} title="Remove this embed" size="sm" onClick={onRemove} />
			</div>
		</div>
	);
};

export default FeedEmbed;
