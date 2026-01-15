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
					cursor: data.bookmarks.length !== 0 ? data.cursor : undefined,
					bookmarks: data.bookmarks,
				};
			},
			structuralSharing: false,
			initialPageParam: undefined,
			getNextPageParam: (last) => last.cursor,
		};
	});
};
