import type { AppBskyActorDefs, At } from '@atcute/client/lexicons';
import type { InfiniteData } from '@mary/solid-query';

import type { CacheMatcher } from '../cache/utils';
import type { SubjectLikersReturn } from '../queries/subject-likers';

export const findAllProfiles = (did: At.DID): CacheMatcher<AppBskyActorDefs.ProfileView> => {
	return {
		filter: {
			queryKey: ['subject-likers'],
		},
		*iterate(data: InfiniteData<SubjectLikersReturn>) {
			for (const page of data.pages) {
				for (const profile of page.likedBy) {
					if (profile.did === did) {
						yield profile;
					}
				}
			}
		},
	};
};
