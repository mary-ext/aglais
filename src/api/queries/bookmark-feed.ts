import { createInfiniteQuery } from '@mary/solid-query';

import type { BookmarkItem, HydratedBookmarkItem } from '~/lib/aglais-bookmarks/db';
import { useAgent } from '~/lib/states/agent';
import { useBookmarks } from '~/lib/states/bookmarks';

import { chunked } from '../utils/utils';

export interface BookmarkFeedReturn {
	cursor: number | undefined;
	items: HydratedBookmarkItem[];
}

export const createBookmarkFeedQuery = (tagId: () => number | undefined) => {
	const bookmarks = useBookmarks();
	const { rpc } = useAgent();

	const listing = createInfiniteQuery(() => {
		const $tagId = tagId();
		const limit = 50;

		return {
			queryKey: ['bookmarks-feed', $tagId],
			async queryFn(ctx): Promise<BookmarkFeedReturn> {
				const pageParam = ctx.pageParam;

				const db = await bookmarks.open();
				const raws: BookmarkItem[] = [];

				// Retrieve bookmarks from store
				{
					const tx = db.transaction('bookmarks', 'readonly');
					const bookmarksStore = tx.objectStore('bookmarks');

					let iterator: AsyncIterable<{ readonly value: BookmarkItem }>;
					if ($tagId === undefined) {
						const query = pageParam !== undefined ? IDBKeyRange.upperBound(pageParam, true) : undefined;

						iterator = bookmarksStore.index('bookmarked_at').iterate(query, 'prev');
					} else {
						const query =
							pageParam !== undefined
								? IDBKeyRange.bound([$tagId, undefined], [$tagId, pageParam], false, true)
								: IDBKeyRange.bound([$tagId, undefined], [$tagId, undefined]);

						iterator = bookmarksStore.index('tags,bookmarked_at').iterate(query, 'prev');
					}

					for await (const cursor of iterator) {
						raws.push(cursor.value);

						if (raws.length >= limit) {
							break;
						}
					}
				}

				const hydrated: HydratedBookmarkItem[] = [];

				// Retrieve live view
				{
					const postUris = raws.map((item) => item.view.uri);
					const posts = (
						await Promise.all(
							chunked(postUris, 25).map(async (uriChunk) => {
								const { data } = await rpc.get('app.bsky.feed.getPosts', {
									signal: ctx.signal,
									params: {
										uris: uriChunk,
									},
								});

								return data.posts;
							}),
						)
					).flat();

					const postMap = new Map(posts.map((view) => [view.uri, view]));

					for (const item of raws) {
						const hydratedView = postMap.get(item.view.uri);

						hydrated.push({
							post: hydratedView ?? item.view,
							stale: !hydratedView,
							bookmarkedAt: item.bookmarked_at,
						});
					}
				}

				const last = hydrated.length >= limit ? hydrated[hydrated.length - 1] : undefined;

				return {
					cursor: last ? last.bookmarkedAt : undefined,
					items: hydrated,
				};
			},
			initialPageParam: undefined as number | undefined,
			getNextPageParam: (last) => last.cursor,
		};
	});

	return listing;
};
