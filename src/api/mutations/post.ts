import type { AppBskyFeedDefs } from '@atcute/client/lexicons';
import { useQueryClient } from '@mary/solid-query';

import { useAgent } from '~/lib/states/agent';
import { useSession } from '~/lib/states/session';

import { type PostShadowView, updatePostShadow } from '../cache/post-shadow';
import { getCurrentDate } from '../utils/misc';
import { createRecord, deleteRecord } from '../utils/records';
import { parseAtUri } from '../utils/strings';
import { createToggleMutationQueue } from '../utils/toggle-mutation';

export const createPostLikeMutation = (
	post: () => AppBskyFeedDefs.PostView,
	shadow: () => PostShadowView,
) => {
	const queryClient = useQueryClient();
	const { rpc } = useAgent();
	const { currentAccount } = useSession();

	const postUri = post().uri;

	const toggle = createToggleMutationQueue({
		initialState() {
			return shadow().likeUri;
		},
		async mutate(prevLikeUri, shouldLike) {
			if (shouldLike) {
				if (prevLikeUri) {
					return prevLikeUri;
				}

				const result = await createRecord(rpc, {
					repo: currentAccount!.did,
					collection: 'app.bsky.feed.like',
					record: {
						$type: 'app.bsky.feed.like',
						createdAt: getCurrentDate(),
						subject: {
							uri: postUri,
							cid: post().cid,
						},
					},
				});

				return result.uri;
			} else if (prevLikeUri) {
				const uri = parseAtUri(prevLikeUri);

				await deleteRecord(rpc, {
					repo: currentAccount!.did,
					collection: 'app.bsky.feed.like',
					rkey: uri.rkey,
				});

				return;
			}
		},
		finalize(finalLikeUri) {
			updatePostShadow(queryClient, postUri, { likeUri: finalLikeUri });
		},
	});

	const mutate = (next: boolean) => {
		toggle(next);
		updatePostShadow(queryClient, postUri, { likeUri: next ? 'pending' : undefined });
	};

	return mutate;
};

export const createPostRepostMutation = (
	post: () => AppBskyFeedDefs.PostView,
	shadow: () => PostShadowView,
) => {
	const queryClient = useQueryClient();
	const { rpc } = useAgent();
	const { currentAccount } = useSession();

	const postUri = post().uri;

	const toggle = createToggleMutationQueue({
		initialState() {
			return shadow().repostUri;
		},
		async mutate(prevRepostUri, shouldRepost) {
			if (shouldRepost) {
				if (prevRepostUri) {
					return prevRepostUri;
				}

				const result = await createRecord(rpc, {
					repo: currentAccount!.did,
					collection: 'app.bsky.feed.repost',
					record: {
						$type: 'app.bsky.feed.repost',
						createdAt: getCurrentDate(),
						subject: {
							uri: postUri,
							cid: post().cid,
						},
					},
				});

				return result.uri;
			} else if (prevRepostUri) {
				const uri = parseAtUri(prevRepostUri);

				await deleteRecord(rpc, {
					repo: currentAccount!.did,
					collection: 'app.bsky.feed.repost',
					rkey: uri.rkey,
				});

				return;
			}
		},
		finalize(finalRepostUri) {
			updatePostShadow(queryClient, postUri, { repostUri: finalRepostUri });
		},
	});

	const mutate = (next: boolean) => {
		toggle(next);
		updatePostShadow(queryClient, postUri, { repostUri: next ? 'pending' : undefined });
	};

	return mutate;
};
