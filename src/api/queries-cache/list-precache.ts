import type { AppBskyGraphDefs } from '@atcute/bluesky';
import type { QueryClient } from '@mary/solid-query';

export const precacheList = (
	queryClient: QueryClient,
	list: AppBskyGraphDefs.ListView | AppBskyGraphDefs.ListViewBasic,
) => {
	queryClient.setQueryData(['list-meta-precache', list.uri], list);
};
