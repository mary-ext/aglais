import type { AppBskyActorDefs } from '@atcute/client/lexicons';
import { type InfiniteData, type QueryFunctionContext as QC, createInfiniteQuery } from '@mary/solid-query';

import { useAgent } from '~/lib/states/agent';

import { type ProfilesListWithSubjectPage, toProfilesListWithSubjectPage } from '../types/profile-response';

export const createProfileFollowersQuery = (didOrHandle: () => string) => {
	const { rpc } = useAgent();

	return createInfiniteQuery((queryClient) => {
		const $didOrHandle = didOrHandle();

		return {
			queryKey: ['profile-followers', $didOrHandle],
			async queryFn(ctx: QC<never, string | undefined>): Promise<ProfilesListWithSubjectPage> {
				const { data } = await rpc.get('app.bsky.graph.getFollowers', {
					signal: ctx.signal,
					params: {
						actor: $didOrHandle,
						limit: 50,
						cursor: ctx.pageParam,
					},
				});

				return toProfilesListWithSubjectPage(data, 'followers');
			},
			structuralSharing: false,
			initialPageParam: undefined,
			getNextPageParam: (last) => last.cursor,
			placeholderData(): InfiniteData<ProfilesListWithSubjectPage> | undefined {
				const profileQueryKey = ['profile', $didOrHandle];
				const profile = queryClient.getQueryData<AppBskyActorDefs.ProfileViewDetailed>(profileQueryKey);

				if (profile) {
					return {
						pages: [
							{
								cursor: undefined,
								// We'll make this fit.
								subject: profile as any,
								profiles: [],
							},
						],
						pageParams: [],
					};
				}
			},
		};
	});
};
