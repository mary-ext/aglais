import type { AppBskyActorDefs, At } from '@mary/bluesky-client/lexicons';

import type { CacheMatcher } from '../cache/utils';

export const findAllProfiles = (did: At.DID): CacheMatcher<AppBskyActorDefs.ProfileViewDetailed> => {
	return {
		filter: {
			queryKey: ['profile', did],
		},
		*iterate(data: AppBskyActorDefs.ProfileViewDetailed) {
			yield data;
		},
	};
};
