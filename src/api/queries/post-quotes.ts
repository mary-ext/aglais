import type { AppBskyFeedGetQuotes } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import type { ResourceUri } from '@atcute/lexicons';
import { type QueryFunctionContext as QC, createInfiniteQuery } from '@mary/solid-query';

import { useAgent } from '~/lib/states/agent';

export const createPostQuotesQuery = (uri: () => ResourceUri) => {
	const { client } = useAgent();

	return createInfiniteQuery(() => {
		const $uri = uri();

		return {
			queryKey: ['post-quotes', $uri],
			structuralSharing: false,
			async queryFn(ctx: QC<never, string | undefined>): Promise<AppBskyFeedGetQuotes.$output> {
				const data = await ok(
					client.get('app.bsky.feed.getQuotes', {
						signal: ctx.signal,
						params: {
							uri: $uri,
							limit: 50,
							cursor: ctx.pageParam,
						},
					}),
				);

				return data;
			},
			initialPageParam: undefined,
			getNextPageParam: (last) => last.cursor,
		};
	});
};
