import type { AppBskyFeedGetRepostedBy } from '@mary/bluesky-client/lexicons';
import type { QueryFunctionContext as QC } from '@mary/solid-query';
import { createInfiniteQuery } from '@mary/solid-query';

import { useAgent } from '~/lib/states/agent';

export const createSubjectRepostersQuery = (uri: () => string) => {
	const { rpc } = useAgent();

	return createInfiniteQuery(() => {
		const $uri = uri();

		return {
			queryKey: ['subject-reposters', $uri],
			structuralSharing: false,
			async queryFn(ctx: QC<never, string | undefined>): Promise<AppBskyFeedGetRepostedBy.Output> {
				const { data } = await rpc.get('app.bsky.feed.getRepostedBy', {
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
