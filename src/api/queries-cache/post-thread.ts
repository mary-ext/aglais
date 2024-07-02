import type {
	AppBskyActorDefs,
	AppBskyFeedDefs,
	AppBskyFeedGetPostThread,
	At,
} from '@mary/bluesky-client/lexicons';
import type { QueryClient } from '@mary/solid-query';

import { embedViewRecordToPostView, getEmbeddedPost } from '../utils/post';

function* traverseThread(
	node: AppBskyFeedGetPostThread.Output['thread'],
): Generator<AppBskyFeedDefs.ThreadViewPost> {
	if (node.$type === 'app.bsky.feed.defs#threadViewPost') {
		const parent = node.parent;
		const replies = node.replies;

		if (parent !== undefined) {
			yield* traverseThread(parent);
		}

		yield node;

		if (replies?.length) {
			for (let idx = 0, len = replies.length; idx < len; idx++) {
				const reply = replies[idx];
				yield* traverseThread(reply);
			}
		}
	}
}

export function* findAllPostsInQueryData(
	queryClient: QueryClient,
	uri: string,
	includeQuote = false,
): Generator<AppBskyFeedDefs.PostView> {
	const entries = queryClient.getQueriesData<AppBskyFeedGetPostThread.Output['thread']>({
		queryKey: ['post-thread'],
	});

	for (const [_key, data] of entries) {
		if (data === undefined) {
			continue;
		}

		for (const thread of traverseThread(data)) {
			const post = thread.post;

			if (post.uri === uri) {
				yield post;
			}

			if (includeQuote) {
				const embeddedPost = getEmbeddedPost(post.embed);
				if (embeddedPost && embeddedPost.uri === uri) {
					yield embedViewRecordToPostView(embeddedPost);
				}
			}
		}
	}
}

export function* findAllProfilesInQueryData(
	queryClient: QueryClient,
	did: At.DID,
): Generator<AppBskyActorDefs.ProfileViewBasic> {
	const entries = queryClient.getQueriesData<AppBskyFeedGetPostThread.Output['thread']>({
		queryKey: ['post-thread'],
	});

	for (const [_key, data] of entries) {
		if (data === undefined) {
			continue;
		}

		for (const thread of traverseThread(data)) {
			const post = thread.post;

			{
				if (post.author.did === did) {
					yield post.author;
				}

				const embeddedPost = getEmbeddedPost(post.embed);
				if (embeddedPost && embeddedPost.author.did === did) {
					yield embeddedPost.author;
				}
			}
		}
	}
}
