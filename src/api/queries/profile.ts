import { modifyMutable, reconcile } from 'solid-js/store';

import type { AppBskyActorDefs } from '@atcute/client/lexicons';
import { createQuery } from '@mary/solid-query';

import { useAgent } from '~/lib/states/agent';
import { useSession } from '~/lib/states/session';

import { dequal } from '../utils/dequal';

export interface ProfileQueryOptions {
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

					{
						const accountData = currentAccount.data;

						if (!accountData.profile) {
							accountData.profile = data;
						} else {
							modifyMutable(accountData.profile, reconcile(data));
						}
					}
				}

				return data;
			},
			placeholderData(): AppBskyActorDefs.ProfileViewDetailed | undefined {
				return queryClient.getQueryData(['profile-precache', $didOrHandle]);
			},
			initialData(): AppBskyActorDefs.ProfileViewDetailed | undefined {
				if (currentAccount !== undefined && currentAccount.did === $didOrHandle) {
					return currentAccount.data.profile;
				}
			},
			initialDataUpdatedAt: 0,
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
