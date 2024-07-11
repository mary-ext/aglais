import type { AppBskyActorDefs, At, AppBskyGraphGetFollows } from '@mary/bluesky-client/lexicons';
import type { InfiniteData } from '@mary/solid-query';

import type { CacheMatcher } from '../cache/utils';

export const findAllProfiles = (did: At.DID): CacheMatcher<AppBskyActorDefs.ProfileView> => {
	return {
		filter: {
			queryKey: ['profile-following'],
		},
		*iterate(data: InfiniteData<AppBskyGraphGetFollows.Output>) {
			for (const page of data.pages) {
				for (const profile of page.follows) {
					if (profile.did === did) {
						yield profile;
					}
				}
			}
		},
	};
};
