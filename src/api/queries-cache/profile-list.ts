import type { AppBskyActorDefs, At } from '@atcute/client/lexicons';
import type { InfiniteData } from '@mary/solid-query';

import type { CacheMatcher } from '../cache/utils';
import type { ProfilesListPage, ProfilesListWithSubjectPage } from '../types/profile-response';

export const findAllProfiles = (did: At.DID): CacheMatcher<AppBskyActorDefs.ProfileView> => {
	return {
		filter: [
			{ queryKey: ['profile-followers'] },
			{ queryKey: ['profile-following'] },
			{ queryKey: ['profile-known-followers'] },
			{ queryKey: ['search-profiles'] },
			{ queryKey: ['subject-likers'] },
			{ queryKey: ['subject-reposters'] },
		],
		*iterate(data: InfiniteData<ProfilesListPage | ProfilesListWithSubjectPage>) {
			for (const page of data.pages) {
				for (const profile of page.profiles) {
					if (profile.did === did) {
						yield profile;
					}
				}
			}
		},
	};
};
