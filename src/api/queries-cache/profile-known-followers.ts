import type { AppBskyActorDefs, AppBskyGraphGetKnownFollowers, At } from '@atcute/client/lexicons';
import type { InfiniteData } from '@mary/solid-query';

import type { CacheMatcher } from '../cache/utils';

export const findAllProfiles = (did: At.DID): CacheMatcher<AppBskyActorDefs.ProfileView> => {
	return {
		filter: {
			queryKey: ['profile-known-followers'],
		},
		*iterate(data: InfiniteData<AppBskyGraphGetKnownFollowers.Output>) {
			for (const page of data.pages) {
				for (const profile of page.followers) {
					if (profile.did === did) {
						yield profile;
					}
				}
			}
		},
	};
};
