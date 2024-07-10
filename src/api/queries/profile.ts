import type { AppBskyActorDefs } from '@mary/bluesky-client/lexicons';
import { createQuery, type QueryPersister } from '@mary/solid-query';

import { useAgent } from '~/lib/states/agent';
import { useSession } from '~/lib/states/session';

export const createProfileQuery = (didOrHandle: () => string, persister?: QueryPersister) => {
	const { rpc } = useAgent();
	const { currentAccount } = useSession();

	return createQuery((queryClient) => {
		const $didOrHandle = didOrHandle();

		return {
			queryKey: ['profile', $didOrHandle],
			persister: persister as any,
			async queryFn(ctx): Promise<AppBskyActorDefs.ProfileViewDetailed> {
				const { data } = await rpc.get('app.bsky.actor.getProfile', {
					signal: ctx.signal,
					params: {
						actor: $didOrHandle!,
					},
				});

				if (currentAccount !== undefined && currentAccount.did === data.did) {
					// Unset `knownFollowers` as we don't need that on our own profile.
					data.viewer!.knownFollowers = undefined;
				}

				return data;
			},
			placeholderData() {
				return queryClient.getQueryData(['profile-precache', $didOrHandle]);
			},
		};
	});
};
