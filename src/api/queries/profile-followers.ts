import type { AppBskyActorDefs, AppBskyGraphGetFollowers } from '@mary/bluesky-client/lexicons';
import { createInfiniteQuery, type InfiniteData } from '@mary/solid-query';

import { useAgent } from '~/lib/states/agent';

export const createProfileFollowersQuery = (didOrHandle: () => string) => {
	const { rpc } = useAgent();

	return createInfiniteQuery((queryClient) => {
		const $didOrHandle = didOrHandle();

		return {
			queryKey: ['profile-followers', $didOrHandle],
			async queryFn(ctx): Promise<AppBskyGraphGetFollowers.Output> {
				const { data } = await rpc.get('app.bsky.graph.getFollowers', {
					signal: ctx.signal,
					params: {
						actor: $didOrHandle,
						limit: 50,
						// @ts-expect-error: not sure how pageParam ended up unknown
						cursor: ctx.pageParam,
					},
				});

				return data;
			},
			structuralSharing: false,
			initialPageParam: undefined as string | undefined,
			getNextPageParam: (last) => last.cursor,
			placeholderData(): InfiniteData<AppBskyGraphGetFollowers.Output> | undefined {
				const profileQueryKey = ['profile', $didOrHandle];
				const profile = queryClient.getQueryData<AppBskyActorDefs.ProfileViewDetailed>(profileQueryKey);

				if (profile) {
					return {
						pages: [
							{
								cursor: undefined,
								followers: [],
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
