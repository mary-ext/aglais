import { createMemo } from 'solid-js';

import type { AppBskyFeedDefs } from '@atcute/bluesky';
import { useQueryClient } from '@mary/solid-query';

import { moderateGeneric } from '~/api/moderation/entities/generic';
import { precacheFeed } from '~/api/queries-cache/feed-precache';
import { assertCanonicalResourceUri } from '~/api/types/at-uri';

import { inject } from '~/lib/states/singleton';
import ModerationService from '~/lib/states/singletons/moderation';

import Avatar from '../avatar';

export interface FeedEmbedProps {
	/** Expected to be static */
	feed: AppBskyFeedDefs.GeneratorView;
	/** Expected to be static */
	interactive?: boolean;
}

const FeedEmbed = ({ feed, interactive }: FeedEmbedProps) => {
	const queryClient = useQueryClient();

	const moderationOptions = inject(ModerationService);

	const moderation = createMemo(() => moderateGeneric(feed, feed.creator.did, moderationOptions()));

	const href = `/${feed.creator.did}/feeds/${assertCanonicalResourceUri(feed.uri).rkey}`;

	return (
		<a
			href={interactive ? href : undefined}
			onClick={() => precacheFeed(queryClient, feed)}
			class={
				`flex gap-3 overflow-hidden rounded-md border border-outline p-3` +
				(interactive ? ` hover:bg-contrast/sm active:bg-contrast/sm-pressed` : ``)
			}
		>
			<Avatar type="generator" src={feed.avatar} moderation={moderation()} class="mt-0.5" />

			<div class="min-w-0 grow">
				<p class="line-clamp-2 break-words text-sm font-bold">{/* @once */ feed.displayName}</p>
				<p class="line-clamp-2 break-words text-de text-contrast-muted">
					Feed by <span class="lowercase">{/* @once */ `@${feed.creator.handle}`}</span>
				</p>
			</div>
		</a>
	);
};

export default FeedEmbed;
