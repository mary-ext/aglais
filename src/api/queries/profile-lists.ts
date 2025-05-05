import { ok } from '@atcute/client';
import type { At } from '@atcute/client/lexicons';
import { type QueryFunctionContext as QC, createInfiniteQuery } from '@mary/solid-query';

import { useAgent } from '~/lib/states/agent';

export const createProfileListsQuery = (didOrHandle: () => At.Identifier) => {
	const { client } = useAgent();

	const collator = new Intl.Collator('en-US');

	return createInfiniteQuery(() => {
		const $didOrHandle = didOrHandle();

		return {
			queryKey: ['profile-lists', $didOrHandle],
			async queryFn(ctx: QC<never, string | undefined>) {
				const data = await ok(
					client.get('app.bsky.graph.getLists', {
						signal: ctx.signal,
						params: {
							actor: $didOrHandle,
							limit: 100,
							cursor: ctx.pageParam,
						},
					}),
				);

				data.lists.sort((a, b) => collator.compare(a.name, b.name));
				return data;
			},
			structuralSharing: false,
			initialPageParam: undefined,
			getNextPageParam: (last) => last.cursor,
		};
	});
};
