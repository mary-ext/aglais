import type { AppBskyFeedGetQuotes, At } from '@atcute/client/lexicons';
import { type QueryFunctionContext as QC, createInfiniteQuery } from '@mary/solid-query';

import { useAgent } from '~/lib/states/agent';

export const createPostQuotesQuery = (uri: () => At.ResourceUri) => {
	const { rpc } = useAgent();

	return createInfiniteQuery(() => {
		const $uri = uri();

		return {
			queryKey: ['post-quotes', $uri],
			structuralSharing: false,
			async queryFn(ctx: QC<never, string | undefined>): Promise<AppBskyFeedGetQuotes.Output> {
				const { data } = await rpc.get('app.bsky.feed.getQuotes', {
					signal: ctx.signal,
					params: {
						uri: $uri,
						limit: 50,
						cursor: ctx.pageParam,
					},
				});

				return data;
			},
			initialPageParam: undefined,
			getNextPageParam: (last) => last.cursor,
		};
	});
};
