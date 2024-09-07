import type { AppBskyActorDefs } from '@atcute/client/lexicons';
import { useQueryClient } from '@mary/solid-query';

import { useAgent } from '~/lib/states/agent';
import { useSession } from '~/lib/states/session';

import { updateProfileShadow, type ProfileShadowView } from '../cache/profile-shadow';
import { createRecord, deleteRecord } from '../utils/records';
import { parseAtUri } from '../utils/strings';
import { createToggleMutationQueue } from '../utils/toggle-mutation';
import { getCurrentDate } from '../utils/misc';

export const createProfileFollowMutation = (
	profile: () => AppBskyActorDefs.ProfileView | AppBskyActorDefs.ProfileViewDetailed,
	shadow: () => ProfileShadowView,
) => {
	const queryClient = useQueryClient();
	const { rpc } = useAgent();
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

				const result = await createRecord(rpc, {
					repo: currentAccount!.did,
					collection: 'app.bsky.graph.follow',
					record: {
						createdAt: getCurrentDate(),
						subject: did,
					},
				});

				return result.uri;
			} else if (prevFollowUri) {
				const uri = parseAtUri(prevFollowUri);

				await deleteRecord(rpc, {
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
