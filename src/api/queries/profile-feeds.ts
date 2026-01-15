import { ok } from '@atcute/client';
import type { ActorIdentifier } from '@atcute/lexicons';
import { type QueryFunctionContext as QC, createInfiniteQuery } from '@mary/solid-query';

import { useAgent } from '~/lib/states/agent';

export const createProfileFeedsQuery = (didOrHandle: () => ActorIdentifier) => {
	const { appview } = useAgent();

	return createInfiniteQuery(() => {
		const $didOrHandle = didOrHandle();

		return {
			queryKey: ['profile-feeds', $didOrHandle],
			async queryFn(ctx: QC<never, string | undefined>) {
				const data = await ok(
					appview.get('app.bsky.feed.getActorFeeds', {
						signal: ctx.signal,
						params: {
							actor: $didOrHandle,
							limit: 100,
							cursor: ctx.pageParam,
						},
					}),
				);

				data.feeds.sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0));
				return data;
			},
			structuralSharing: false,
			initialPageParam: undefined,
			getNextPageParam: (last) => last.cursor,
		};
	});
};
