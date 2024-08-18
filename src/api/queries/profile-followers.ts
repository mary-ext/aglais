import type { AppBskyActorDefs, AppBskyGraphGetFollowers } from '@atcute/client/lexicons';
import { createInfiniteQuery, type InfiniteData, type QueryFunctionContext as QC } from '@mary/solid-query';
import { useAgent } from '~/lib/states/agent';

export const createProfileFollowersQuery = (didOrHandle: () => string) => {
	const { rpc } = useAgent();

	return createInfiniteQuery((queryClient) => {
		const $didOrHandle = didOrHandle();

		return {
			queryKey: ['profile-followers', $didOrHandle],
			async queryFn(ctx: QC<never, string | undefined>): Promise<AppBskyGraphGetFollowers.Output> {
				const { data } = await rpc.get('app.bsky.graph.getFollowers', {
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
