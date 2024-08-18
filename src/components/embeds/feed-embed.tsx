import { createMemo } from 'solid-js';

import type { AppBskyFeedDefs } from '@atcute/client/lexicons';

import { moderateGeneric } from '~/api/moderation/entities/generic';
import { parseAtUri } from '~/api/utils/strings';

import { useModerationOptions } from '~/lib/states/moderation';

import Avatar from '../avatar';

export interface FeedEmbedProps {
	/** Expected to be static */
	feed: AppBskyFeedDefs.GeneratorView;
	/** Expected to be static */
	interactive?: boolean;
}

const FeedEmbed = ({ feed, interactive }: FeedEmbedProps) => {
	const moderationOptions = useModerationOptions();
	const moderation = createMemo(() => moderateGeneric(feed, feed.creator.did, moderationOptions()));

	const uri = parseAtUri(feed.uri);
	const href = `/${feed.creator.did}/feeds/${uri.rkey}`;

	return (
		<a
			href={interactive ? href : undefined}
			class={
				`flex gap-3 overflow-hidden rounded-md border border-outline p-3` +
				(interactive ? ` hover:bg-contrast/sm active:bg-contrast/sm-pressed` : ``)
			}
		>
			<Avatar type="feed" src={feed.avatar} moderation={moderation()} class="mt-0.5" />

			<div class="min-w-0 grow">
				<p class="line-clamp-2 break-words text-sm font-bold">{/* @once */ feed.displayName}</p>
				<p class="line-clamp-2 break-words text-de text-contrast-muted">{
					/* @once */ `Feed by @${feed.creator.handle}`
				}</p>
			</div>
		</a>
	);
};

export default FeedEmbed;
