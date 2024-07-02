import type { AppBskyFeedGetPostThread } from '@mary/bluesky-client/lexicons';
import { createQuery } from '@mary/solid-query';

import { useAgent } from '~/lib/states/agent';

import { findPostsInCache } from '../cache/post-shadow';

const MAX_HEIGHT = 10;
const MAX_DEPTH = 4;

export const usePostThreadQuery = (uri: () => string) => {
	const { rpc } = useAgent();

	return createQuery((queryClient) => {
		const $uri = uri();

		return {
			queryKey: ['post-thread', $uri],
			structuralSharing: false,
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
			placeholderData(): AppBskyFeedGetPostThread.Output['thread'] | undefined {
				for (const post of findPostsInCache(queryClient, $uri, true)) {
					return {
						$type: 'app.bsky.feed.defs#threadViewPost',
						post: post,
						parent: undefined,
						replies: undefined,
					};
				}

				return undefined;
			},
		};
	});
};
