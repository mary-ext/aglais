import type { AppBskyFeedDefs } from '@atcute/bluesky';
import type { QueryClient } from '@mary/solid-query';

export const precacheFeed = (queryClient: QueryClient, feed: AppBskyFeedDefs.GeneratorView) => {
	queryClient.setQueryData(['feed-meta-precache', feed.uri], feed);
};
