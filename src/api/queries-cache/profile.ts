import type { AppBskyActorDefs, At } from '@mary/bluesky-client/lexicons';
import type { QueryClient } from '@mary/solid-query';

export function* findAllProfilesInQueryData(
	queryClient: QueryClient,
	did: At.DID,
): Generator<AppBskyActorDefs.ProfileViewDetailed> {
	const data = queryClient.getQueryData<AppBskyActorDefs.ProfileViewDetailed>(['profile', did]);

	if (data !== undefined && data.did === did) {
		yield data;
	}
}
