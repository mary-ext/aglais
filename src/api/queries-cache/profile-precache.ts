import type { AppBskyActorDefs } from '@atcute/client/lexicons';
import type { QueryClient } from '@mary/solid-query';

export const precacheProfile = (
	queryClient: QueryClient,
	profile: AppBskyActorDefs.ProfileViewBasic | AppBskyActorDefs.ProfileView,
) => {
	queryClient.setQueryData(['profile-precache', profile.did], profile);
};
