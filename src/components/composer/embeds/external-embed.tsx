import { Match, Switch, onCleanup } from 'solid-js';

import type { AppBskyEmbedExternal } from '@atcute/client/lexicons';

import { createLinkMetaQuery } from '~/api/queries/composer';

import CircularProgress from '~/components/circular-progress';
import IconButton from '~/components/icon-button';
import CrossLargeOutlinedIcon from '~/components/icons-central/cross-large-outline';

import ExternalEmbedContent from '~/components/embeds/external-embed';

import type { PostExternalEmbed } from '../lib/state';
import type { BaseEmbedProps } from './types';

export interface ExternalEmbedProps extends BaseEmbedProps {
	embed: PostExternalEmbed;
}

const ExternalEmbed = (props: ExternalEmbedProps) => {
	const query = createLinkMetaQuery(() => props.embed.uri);

	const onRemove = () => props.dispatch({ type: 'remove_media' });

	return (
		<div class="relative">
			<Switch>
				<Match when={query.data} keyed>
					{(data) => {
						const thumbUrl = data.thumb && URL.createObjectURL(data.thumb);
						if (thumbUrl) {
							onCleanup(() => URL.revokeObjectURL(thumbUrl));
						}

						const embed: AppBskyEmbedExternal.View = {
							external: {
								title: data.title,
								description: data.description,
								uri: data.uri,
								thumb: thumbUrl,
							},
						};

						return <ExternalEmbedContent embed={embed} />;
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

export default ExternalEmbed;
