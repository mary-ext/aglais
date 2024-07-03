import type { AppBskyActorDefs } from '@mary/bluesky-client/lexicons';
import type { QueryClient } from '@mary/solid-query';

export const precacheProfile = (queryClient: QueryClient, profile: AppBskyActorDefs.ProfileViewBasic) => {
	queryClient.setQueryData(['profile-precache', profile.did], profile);
	queryClient.setQueryData(['profile-precache', profile.handle], profile);
};
