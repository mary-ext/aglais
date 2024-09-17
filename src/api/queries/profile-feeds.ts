import { type QueryFunctionContext as QC, createInfiniteQuery } from '@mary/solid-query';

import { useAgent } from '~/lib/states/agent';

export const createProfileFeedsQuery = (didOrHandle: () => string) => {
	const { rpc } = useAgent();

	return createInfiniteQuery(() => {
		const $didOrHandle = didOrHandle();

		return {
			queryKey: ['profile-feeds', $didOrHandle],
			async queryFn(ctx: QC<never, string | undefined>) {
				const { data } = await rpc.get('app.bsky.feed.getActorFeeds', {
					signal: ctx.signal,
					params: {
						actor: $didOrHandle,
						limit: 100,
						cursor: ctx.pageParam,
					},
				});

				data.feeds.sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0));
				return data;
			},
			structuralSharing: false,
			initialPageParam: undefined,
			getNextPageParam: (last) => last.cursor,
		};
	});
};
