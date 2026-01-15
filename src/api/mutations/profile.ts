import type { AppBskyActorDefs } from '@atcute/bluesky';
import { useQueryClient } from '@mary/solid-query';

import { useAgent } from '~/lib/states/agent';
import { useSession } from '~/lib/states/session';

import { type ProfileShadowView, updateProfileShadow } from '../cache/profile-shadow';
import { assertCanonicalResourceUri } from '../types/at-uri';
import { getCurrentDate } from '../utils/misc';
import { createRecord, deleteRecord } from '../utils/records';
import { createToggleMutationQueue } from '../utils/toggle-mutation';

export const createProfileFollowMutation = (
	profile: () => AppBskyActorDefs.ProfileView | AppBskyActorDefs.ProfileViewDetailed,
	shadow: () => ProfileShadowView,
) => {
	const queryClient = useQueryClient();
	const { pds } = useAgent();
	const { currentAccount } = useSession();

	const did = profile().did;

	const toggle = createToggleMutationQueue({
		initialState() {
			return shadow().followUri;
		},
		async mutate(prevFollowUri, shouldFollow) {
			if (shouldFollow) {
				if (prevFollowUri) {
					return prevFollowUri;
				}

				const result = await createRecord(pds!, {
					repo: currentAccount!.did,
					collection: 'app.bsky.graph.follow',
					record: {
						$type: 'app.bsky.graph.follow',
						createdAt: getCurrentDate(),
						subject: did,
					},
				});

				return result.uri;
			} else if (prevFollowUri) {
				const uri = assertCanonicalResourceUri(prevFollowUri);

				await deleteRecord(pds!, {
					repo: currentAccount!.did,
					collection: 'app.bsky.graph.follow',
					rkey: uri.rkey,
				});

				return;
			}
		},
		finalize(finalFollowUri) {
			updateProfileShadow(queryClient, did, { followUri: finalFollowUri });
		},
	});

	const mutate = (next: boolean) => {
		toggle(next);
		updateProfileShadow(queryClient, did, { followUri: next ? 'pending' : undefined });
	};

	return mutate;
};
