import { XRPCError } from '@atcute/client';
import type { AppBskyFeedDefs, Brand } from '@atcute/client/lexicons';
import { createQuery } from '@mary/solid-query';

import { useAgent } from '~/lib/states/agent';

import { findPostsInCache } from '../cache/post-shadow';

const MAX_HEIGHT = 10;
const MAX_DEPTH = 4;

type ThreadReturn = Brand.Union<AppBskyFeedDefs.ThreadViewPost | AppBskyFeedDefs.BlockedPost>;

export const usePostThreadQuery = (uri: () => string) => {
	const { rpc } = useAgent();

	return createQuery((queryClient) => {
		const $uri = uri();

		return {
			queryKey: ['post-thread', $uri],
			structuralSharing: false,
			async queryFn(ctx): Promise<ThreadReturn> {
				const { data } = await rpc.get('app.bsky.feed.getPostThread', {
					signal: ctx.signal,
					params: {
						uri: $uri,
						depth: MAX_DEPTH,
						parentHeight: MAX_HEIGHT,
					},
				});

				const thread = data.thread;

				if (thread.$type === 'app.bsky.feed.defs#notFoundPost') {
					throw new XRPCError(400, { kind: 'NotFound', message: `Post not found: ${$uri}` });
				}

				return thread;
			},
			placeholderData(): ThreadReturn | undefined {
				let found: AppBskyFeedDefs.PostView | undefined;
				let step = 0;

				for (const post of findPostsInCache(queryClient, $uri, true)) {
					found = post;

					// Break if either:
					// - This isn't a quote embed transformed into a post view
					// - We've went through 10 post views
					if (!('$transform' in found) || ++step >= 10) {
						break;
					}
				}

				if (found) {
					return {
						$type: 'app.bsky.feed.defs#threadViewPost',
						post: found,
						parent: undefined,
						replies: undefined,
					};
				}

				return undefined;
			},
		};
	});
};
