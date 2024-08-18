import type {
	AppBskyActorDefs,
	AppBskyFeedDefs,
	AppBskyFeedGetPostThread,
	At,
} from '@atcute/client/lexicons';

import type { CacheMatcher } from '../cache/utils';
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

export const findAllPosts = (uri: string, includeQuote = false): CacheMatcher<AppBskyFeedDefs.PostView> => {
	return {
		filter: {
			queryKey: ['post-thread'],
		},
		*iterate(data: AppBskyFeedGetPostThread.Output['thread']) {
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
		},
	};
};

export const findAllProfiles = (did: At.DID): CacheMatcher<AppBskyActorDefs.ProfileViewBasic> => {
	return {
		filter: {
			queryKey: ['post-thread'],
		},
		*iterate(data: AppBskyFeedGetPostThread.Output['thread']) {
			for (const thread of traverseThread(data)) {
				const post = thread.post;

				if (post.author.did === did) {
					yield post.author;
				}

				const embeddedPost = getEmbeddedPost(post.embed);
				if (embeddedPost && embeddedPost.author.did === did) {
					yield embeddedPost.author;
				}
			}
		},
	};
};
