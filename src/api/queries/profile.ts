import type { AppBskyActorDefs, At } from '@mary/bluesky-client/lexicons';
import { createQuery, type QueryPersister } from '@mary/solid-query';

import { useAgent } from '~/lib/states/agent';
import { useSession } from '~/lib/states/session';

export const useProfileQuery = (did: () => At.DID, persister?: QueryPersister) => {
	const { rpc } = useAgent();
	const { currentAccount } = useSession();

	return createQuery((queryClient) => {
		const $did = did();

		return {
			queryKey: ['profile', $did],
			// enabled: $did !== undefined,
			persister: persister as any,
			async queryFn(ctx): Promise<AppBskyActorDefs.ProfileViewDetailed> {
				const { data } = await rpc.get('app.bsky.actor.getProfile', {
					signal: ctx.signal,
					params: {
						actor: $did!,
					},
				});

				if (currentAccount !== undefined && currentAccount.did === data.did) {
					// Unset `knownFollowers` as we don't need that on our own profile.
					data.viewer!.knownFollowers = undefined;
				}

				return data;
			},
			placeholderData() {
				if (!$did) {
					return;
				}

				return queryClient.getQueryData(['profile-precache', $did]);
			},
		};
	});
};
