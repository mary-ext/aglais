import { Match, Switch } from 'solid-js';

import { createListMetaQuery } from '~/api/queries/list';

import CircularProgress from '~/components/circular-progress';
import ListEmbedContent from '~/components/embeds/list-embed';
import IconButton from '~/components/icon-button';
import CrossLargeOutlinedIcon from '~/components/icons-central/cross-large-outline';

import type { PostListEmbed } from '../lib/state';

export interface ListEmbedProps {
	embed: PostListEmbed;
	active: boolean;
	onRemove: () => void;
}

const ListEmbed = (props: ListEmbedProps) => {
	const query = createListMetaQuery(() => props.embed.uri);

	return (
		<div class="relative">
			<Switch>
				<Match when={query.data} keyed>
					{(data) => {
						return <ListEmbedContent list={data} />;
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

export default ListEmbed;
