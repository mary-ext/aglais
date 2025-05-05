import { ok } from '@atcute/client';
import type { AppBskyUnspeccedGetPopularFeedGenerators } from '@atcute/client/lexicons';
import { type QueryFunctionContext as QC, createInfiniteQuery } from '@mary/solid-query';

import { useAgent } from '~/lib/states/agent';

export const createSearchFeedsQuery = (query: () => string) => {
	const { client } = useAgent();

	return createInfiniteQuery(() => {
		const q = query();

		return {
			queryKey: ['search-feeds', q],
			async queryFn(
				ctx: QC<never, string | undefined>,
			): Promise<AppBskyUnspeccedGetPopularFeedGenerators.Output> {
				const data = await ok(
					client.get('app.bsky.unspecced.getPopularFeedGenerators', {
						signal: ctx.signal,
						params: {
							query: q,
							limit: 50,
							cursor: ctx.pageParam,
						},
					}),
				);

				return data;
			},
			structuralSharing: false,
			initialPageParam: undefined,
			getNextPageParam: (last) => last.cursor,
		};
	});
};
