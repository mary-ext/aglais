import type { AppBskyActorDefs, AppBskyFeedGetRepostedBy, At } from '@atcute/client/lexicons';
import type { InfiniteData } from '@mary/solid-query';

import type { CacheMatcher } from '../cache/utils';

export const findAllProfiles = (did: At.DID): CacheMatcher<AppBskyActorDefs.ProfileView> => {
	return {
		filter: {
			queryKey: ['subject-reposters'],
		},
		*iterate(data: InfiniteData<AppBskyFeedGetRepostedBy.Output>) {
			for (const page of data.pages) {
				for (const profile of page.repostedBy) {
					if (profile.did === did) {
						yield profile;
					}
				}
			}
		},
	};
};
