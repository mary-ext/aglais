import type { AppBskyActorDefs } from '@atcute/bluesky';
import type { QueryClient } from '@mary/solid-query';

export const precacheProfile = (
	queryClient: QueryClient,
	profile: AppBskyActorDefs.ProfileViewBasic | AppBskyActorDefs.ProfileView,
) => {
	queryClient.setQueryData(['profile-precache', profile.did], profile);
};
