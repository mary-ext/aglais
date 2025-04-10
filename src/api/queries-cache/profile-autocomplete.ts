import type { AppBskyActorDefs, AppBskyActorSearchActorsTypeahead, At } from '@atcute/client/lexicons';

import type { CacheMatcher } from '../cache/utils';

export const findAllProfiles = (did: At.Did): CacheMatcher<AppBskyActorDefs.ProfileViewBasic> => {
	return {
		filter: {
			queryKey: ['profile-autocomplete'],
		},
		*iterate(data: AppBskyActorSearchActorsTypeahead.Output) {
			for (const profile of data.actors) {
				if (profile.did === did) {
					yield profile;
				}
			}
		},
	};
};
