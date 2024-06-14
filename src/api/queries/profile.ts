import type { AppBskyActorDefs, At } from '@mary/bluesky-client/lexicons';
import { QueryClient, createQuery, type QueryPersister } from '@mary/solid-query';

import { useAgent } from '~/lib/states/agent';
import { useSession } from '~/lib/states/session';

export const useProfileQuery = (did: () => At.DID | undefined, persister?: QueryPersister) => {
	const { rpc } = useAgent();
	const { currentAccount } = useSession();

	return createQuery(() => {
		const $did = did();

		return {
			queryKey: ['profile', $did],
			enabled: $did !== undefined,
			persister: persister as any,
			async queryFn(ctx) {
				const { data } = await rpc.get('app.bsky.actor.getProfile', {
					signal: ctx.signal,
					params: {
						actor: $did!,
					},
				});

				if (currentAccount !== undefined && currentAccount.did === $did) {
					// Unset `knownFollowers` as we don't need that on our own profile.
					data.viewer!.knownFollowers = undefined;
				}

				return data;
			},
		};
	});
};

export function* findAllProfilesInQueryData(
	queryClient: QueryClient,
	did: At.DID,
): Generator<AppBskyActorDefs.ProfileViewDetailed> {
	const data = queryClient.getQueryData<AppBskyActorDefs.ProfileViewDetailed>(['profile', did]);

	if (data !== undefined && data.did === did) {
		yield data;
	}
}
