import type { QueryFunctionContext as QC } from '@mary/solid-query';
import { createInfiniteQuery } from '@mary/solid-query';

import { useAgent } from '~/lib/states/agent';

import type { ProfilesListPage } from '../types/profile-response';

export const createSubjectLikersQuery = (uri: () => string) => {
	const { rpc } = useAgent();

	return createInfiniteQuery(() => {
		const $uri = uri();

		return {
			queryKey: ['subject-likers', $uri],
			structuralSharing: false,
			async queryFn(ctx: QC<never, string | undefined>): Promise<ProfilesListPage> {
				const { data } = await rpc.get('app.bsky.feed.getLikes', {
					signal: ctx.signal,
					params: {
						uri: $uri,
						limit: 50,
						cursor: ctx.pageParam,
					},
				});

				return {
					cursor: data.cursor,
					profiles: data.likes.map((like) => like.actor),
				};
			},
			initialPageParam: undefined,
			getNextPageParam: (last) => last.cursor,
		};
	});
};
