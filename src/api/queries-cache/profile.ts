import { AppBskyActorDefs } from '@atcute/bluesky';
import type { Did } from '@atcute/lexicons';

import type { CacheMatcher } from '../cache/utils';

export const findAllProfiles = (did: Did): CacheMatcher<AppBskyActorDefs.ProfileViewDetailed> => {
	return {
		filter: {
			queryKey: ['profile', did],
		},
		*iterate(data: AppBskyActorDefs.ProfileViewDetailed) {
			yield data;
		},
	};
};
