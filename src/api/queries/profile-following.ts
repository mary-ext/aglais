import type { AppBskyActorDefs, AppBskyGraphGetFollows } from '@atcute/client/lexicons';
import { createInfiniteQuery, type InfiniteData, type QueryFunctionContext as QC } from '@mary/solid-query';

import { useAgent } from '~/lib/states/agent';

export const createProfileFollowingQuery = (didOrHandle: () => string) => {
	const { rpc } = useAgent();

	return createInfiniteQuery((queryClient) => {
		const $didOrHandle = didOrHandle();

		return {
			queryKey: ['profile-following', $didOrHandle],
			async queryFn(ctx: QC<never, string | undefined>): Promise<AppBskyGraphGetFollows.Output> {
				const { data } = await rpc.get('app.bsky.graph.getFollows', {
					signal: ctx.signal,
					params: {
						actor: $didOrHandle,
						limit: 50,
						cursor: ctx.pageParam,
					},
				});

				return data;
			},
			structuralSharing: false,
			initialPageParam: undefined,
			getNextPageParam: (last) => last.cursor,
			placeholderData(): InfiniteData<AppBskyGraphGetFollows.Output> | undefined {
				const profileQueryKey = ['profile', $didOrHandle];
				const profile = queryClient.getQueryData<AppBskyActorDefs.ProfileViewDetailed>(profileQueryKey);

				if (profile) {
					return {
						pages: [
							{
								cursor: undefined,
								follows: [],
								// @ts-expect-error: force ProfileViewDetailed to fit
								subject: profile,
							},
						],
						pageParams: [],
					};
				}
			},
		};
	});
};
