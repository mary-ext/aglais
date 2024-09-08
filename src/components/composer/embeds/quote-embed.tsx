import { Match, Switch } from 'solid-js';

import type { AppBskyEmbedRecord } from '@atcute/client/lexicons';

import { createPostQuery } from '~/api/queries/post';

import CircularProgress from '~/components/circular-progress';
import QuoteEmbedContent from '~/components/embeds/quote-embed';
import IconButton from '~/components/icon-button';
import CrossLargeOutlinedIcon from '~/components/icons-central/cross-large-outline';

import type { PostQuoteEmbed } from '../lib/state';

import type { BaseEmbedProps } from './types';

export interface QuoteEmbedProps extends BaseEmbedProps {
	embed: PostQuoteEmbed;
}

const QuoteEmbed = (props: QuoteEmbedProps) => {
	const query = createPostQuery(() => props.embed.uri);

	const onRemove = () => props.dispatch({ type: 'remove_record' });

	return (
		<div class="relative">
			<Switch>
				<Match when={query.data} keyed>
					{(data) => {
						const quote: AppBskyEmbedRecord.ViewRecord = {
							author: data.author,
							cid: data.cid,
							indexedAt: data.indexedAt,
							uri: data.uri,
							value: data.record,
							embeds: data.embed ? [data.embed] : undefined,
							labels: data.labels,
							likeCount: data.likeCount,
							replyCount: data.replyCount,
							repostCount: data.repostCount,
						};

						return <QuoteEmbedContent quote={quote} />;
					}}
				</Match>

				<Match when={query.error}>
					{(error) => <div class="rounded border border-outline p-4">{'' + error()}</div>}
				</Match>

				<Match when>
					<div class="grid place-items-center rounded border border-outline p-4">
						<CircularProgress />
					</div>
				</Match>
			</Switch>

			{!props.embed.origin && (
				<div hidden={!props.active} class="absolute right-0 top-0 p-1">
					<IconButton icon={CrossLargeOutlinedIcon} title="Remove this embed" size="sm" onClick={onRemove} />
				</div>
			)}
		</div>
	);
};

export default QuoteEmbed;
