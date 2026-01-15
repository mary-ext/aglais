import { ok } from '@atcute/client';
import type { ResourceUri } from '@atcute/lexicons';
import { type QueryFunctionContext as QC, createInfiniteQuery } from '@mary/solid-query';

import { useAgent } from '~/lib/states/agent';

export const createListMembersQuery = (listUri: () => ResourceUri) => {
	const { appview } = useAgent();

	return createInfiniteQuery(() => {
		const $listUri = listUri();

		return {
			queryKey: ['list-members', $listUri],
			async queryFn(ctx: QC<never, string | undefined>) {
				const data = await ok(
					appview.get('app.bsky.graph.getList', {
						signal: ctx.signal,
						params: {
							list: $listUri,
							limit: 50,
							cursor: ctx.pageParam,
						},
					}),
				);

				return {
					cursor: data.cursor,
					members: data.items,
				};
			},
			structuralSharing: false,
			initialPageParam: undefined,
			getNextPageParam: (last) => last.cursor,
		};
	});
};
