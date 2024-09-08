import type { AppBskyActorDefs } from '@atcute/client/lexicons';
import { type QueryPersister, createQuery } from '@mary/solid-query';

import { useAgent } from '~/lib/states/agent';
import { useSession } from '~/lib/states/session';

import { dequal } from '../utils/dequal';

export interface ProfileQueryOptions {
	persister?: QueryPersister;
	staleTime?: number;
	gcTime?: number;
}

export const createProfileQuery = (didOrHandle: () => string, opts: ProfileQueryOptions = {}) => {
	const { rpc } = useAgent();
	const { currentAccount } = useSession();

	return createQuery((queryClient) => {
		const $didOrHandle = didOrHandle();

		return {
			queryKey: ['profile', $didOrHandle],
			persister: opts.persister as any,
			staleTime: opts.staleTime,
			gcTime: opts.gcTime,
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
			structuralSharing: ((
				oldData: AppBskyActorDefs.ProfileViewDetailed | undefined,
				newData: AppBskyActorDefs.ProfileViewDetailed,
			) => {
				const newKnownFollowers = newData.viewer?.knownFollowers;

				if (newKnownFollowers) {
					const collator = new Intl.Collator('en');
					newKnownFollowers.followers.sort((a, b) => collator.compare(a.did, b.did));
				}

				if (!oldData || !dequal(oldData, newData)) {
					return newData;
				}

				return oldData;
			}) as any,
		};
	});
};
