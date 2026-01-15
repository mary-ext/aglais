import type { AppBskyUnspeccedGetPopularFeedGenerators } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import { type QueryFunctionContext as QC, createInfiniteQuery } from '@mary/solid-query';

import { useAgent } from '~/lib/states/agent';

export const createSearchFeedsQuery = (query: () => string) => {
	const { appview } = useAgent();

	return createInfiniteQuery(() => {
		const q = query();

		return {
			queryKey: ['search-feeds', q],
			async queryFn(
				ctx: QC<never, string | undefined>,
			): Promise<AppBskyUnspeccedGetPopularFeedGenerators.$output> {
				const data = await ok(
					appview.get('app.bsky.unspecced.getPopularFeedGenerators', {
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
