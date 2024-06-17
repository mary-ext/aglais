import type { AppBskyFeedGetPostThread } from '@mary/bluesky-client/lexicons';
import { createQuery } from '@mary/solid-query';

import { useAgent } from '~/lib/states/agent';

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
						depth: 4,
						parentHeight: 10,
					},
				});

				return data.thread;
			},
		};
	});
};
