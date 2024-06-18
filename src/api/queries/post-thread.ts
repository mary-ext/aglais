import type { AppBskyFeedDefs, AppBskyFeedGetPostThread } from '@mary/bluesky-client/lexicons';
import { QueryClient, createQuery } from '@mary/solid-query';

import { useAgent } from '~/lib/states/agent';

import { embedViewRecordToPostView, getEmbeddedPost } from '../utils/post';

const MAX_HEIGHT = 10;
const MAX_DEPTH = 4;

export const usePostThreadQuery = (uri: () => string) => {
	const { rpc } = useAgent();

	return createQuery(() => {
		const $uri = uri();

		return {
			queryKey: ['post-thread', $uri],
			async queryFn(ctx): Promise<AppBskyFeedGetPostThread.Output['thread']> {
				const { data } = await rpc.get('app.bsky.feed.getPostThread', {
					signal: ctx.signal,
					params: {
						uri: $uri,
						depth: MAX_DEPTH,
						parentHeight: MAX_HEIGHT,
					},
				});

				return data.thread;
			},
		};
	});
};

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
