import type { AppBskyActorDefs, AppBskyActorSearchActorsTypeahead } from '@atcute/bluesky';
import type { Did } from '@atcute/lexicons';

import type { CacheMatcher } from '../cache/utils';

export const findAllProfiles = (did: Did): CacheMatcher<AppBskyActorDefs.ProfileViewBasic> => {
	return {
		filter: {
			queryKey: ['profile-autocomplete'],
		},
		*iterate(data: AppBskyActorSearchActorsTypeahead.$output) {
			for (const profile of data.actors) {
				if (profile.did === did) {
					yield profile;
				}
			}
		},
	};
};
