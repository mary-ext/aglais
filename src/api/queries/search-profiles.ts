import type { AppBskyActorSearchActors } from '@atcute/client/lexicons';
import { type QueryFunctionContext as QC, createInfiniteQuery } from '@mary/solid-query';

import { useAgent } from '~/lib/states/agent';

export const createSearchProfilesQuery = (query: () => string) => {
	const { rpc } = useAgent();

	return createInfiniteQuery(() => {
		const q = query();

		return {
			queryKey: ['search-profiles', q],
			async queryFn(ctx: QC<never, string | undefined>): Promise<AppBskyActorSearchActors.Output> {
				const { data } = await rpc.get('app.bsky.actor.searchActors', {
					signal: ctx.signal,
					params: {
						q: q,
						limit: 50,
						cursor: ctx.pageParam,
					},
				});

				return data;
			},
			structuralSharing: false,
			initialPageParam: undefined,
			getNextPageParam: (last) => last.cursor,
		};
	});
};
