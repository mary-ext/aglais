import type { AppBskyActorDefs, AppBskyActorSearchActors, At } from '@atcute/client/lexicons';
import type { InfiniteData } from '@mary/solid-query';

import type { CacheMatcher } from '../cache/utils';

export const findAllProfiles = (did: At.DID): CacheMatcher<AppBskyActorDefs.ProfileView> => {
	return {
		filter: {
			queryKey: ['search-profiles'],
		},
		*iterate(data: InfiniteData<AppBskyActorSearchActors.Output>) {
			for (const page of data.pages) {
				for (const profile of page.actors) {
					if (profile.did === did) {
						yield profile;
					}
				}
			}
		},
	};
};
