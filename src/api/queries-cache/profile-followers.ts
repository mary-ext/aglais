import type { AppBskyActorDefs, AppBskyGraphGetFollowers, At } from '@mary/bluesky-client/lexicons';
import type { InfiniteData } from '@mary/solid-query';

import type { CacheMatcher } from '../cache/utils';

export const findAllProfiles = (did: At.DID): CacheMatcher<AppBskyActorDefs.ProfileView> => {
	return {
		filter: {
			queryKey: ['profile-followers'],
		},
		*iterate(data: InfiniteData<AppBskyGraphGetFollowers.Output>) {
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
