import type { QueryFunctionContext as QC } from '@mary/solid-query';
import { createInfiniteQuery } from '@mary/solid-query';

import { useAgent } from '~/lib/states/agent';

import { type ProfilesListPage, toProfilesListPage } from '../types/profile-response';

export const createSubjectRepostersQuery = (uri: () => string) => {
	const { rpc } = useAgent();

	return createInfiniteQuery(() => {
		const $uri = uri();

		return {
			queryKey: ['subject-reposters', $uri],
			structuralSharing: false,
			async queryFn(ctx: QC<never, string | undefined>): Promise<ProfilesListPage> {
				const { data } = await rpc.get('app.bsky.feed.getRepostedBy', {
					signal: ctx.signal,
					params: {
						uri: $uri,
						limit: 50,
						cursor: ctx.pageParam,
					},
				});

				return toProfilesListPage(data, 'repostedBy');
			},
			initialPageParam: undefined,
			getNextPageParam: (last) => last.cursor,
		};
	});
};
