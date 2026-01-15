import type { AppBskyBookmarkDefs } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import { type QueryFunctionContext as QC, createInfiniteQuery } from '@mary/solid-query';

import { useAgent } from '~/lib/states/agent';

export interface BookmarksPage {
	cursor: string | undefined;
	bookmarks: AppBskyBookmarkDefs.BookmarkView[];
}

export const createBookmarksQuery = () => {
	const { appview } = useAgent();

	return createInfiniteQuery(() => {
		return {
			queryKey: ['bookmarks'],
			async queryFn(ctx: QC<never, string | undefined>): Promise<BookmarksPage> {
				const data = await ok(
					appview.get('app.bsky.bookmark.getBookmarks', {
						signal: ctx.signal,
						params: {
							cursor: ctx.pageParam,
						},
					}),
				);

				return {
					cursor: data.cursor,
					bookmarks: data.bookmarks,
				};
			},
			structuralSharing: false,
			initialPageParam: undefined,
			getNextPageParam: (last, all) => {
				// stop pagination if the last 4 pages have no bookmarks
				if (all.length >= 4) {
					const recentPages = all.slice(-4);
					const allEmpty = recentPages.every((page) => page.bookmarks.length === 0);
					if (allEmpty) {
						return undefined;
					}
				}

				return last.cursor;
			},
		};
	});
};
