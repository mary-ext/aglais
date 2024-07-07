import { createInfiniteQuery, createQuery } from '@mary/solid-query';

import type { BookmarkItem, HydratedBookmarkItem } from '~/lib/aglais-bookmarks/db';
import { useAgent } from '~/lib/states/agent';
import { useBookmarks } from '~/lib/states/bookmarks';

export const createBookmarkFolderMetaQuery = (tagId: () => string) => {
	const bookmarks = useBookmarks();

	const query = createQuery(() => {
		const $tagId = tagId();

		return {
			queryKey: ['bookmark-folder-meta', $tagId],
			async queryFn() {
				const db = await bookmarks.open();
				const entry = db.get('tags', $tagId);

				if (!entry) {
					throw new Error(`Folder not found`);
				}

				return entry;
			},
		};
	});

	return query;
};

export interface BookmarkFeedReturn {
	cursor: number | undefined;
	items: HydratedBookmarkItem[];
}

export const createBookmarkFeedQuery = (tagId: () => string) => {
	const bookmarks = useBookmarks();
	const { rpc } = useAgent();

	const listing = createInfiniteQuery(() => {
		const $tagId = tagId();
		const limit = 25;

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
					if ($tagId === 'all') {
						const query = pageParam !== undefined ? IDBKeyRange.upperBound(pageParam, true) : undefined;

						iterator = bookmarksStore.index('bookmarked_at').iterate(query, 'prev');
					} else {
						if (pageParam === undefined) {
							iterator = bookmarksStore.index('tags').iterate($tagId, 'prev');
						} else {
							const query = IDBKeyRange.bound([$tagId, undefined], [$tagId, pageParam], false, true);

							iterator = bookmarksStore.index('tags,bookmarked_at').iterate(query, 'prev');
						}
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
				if (raws.length) {
					const { data } = await rpc.get('app.bsky.feed.getPosts', {
						signal: ctx.signal,
						params: {
							uris: raws.map((item) => item.view.uri),
						},
					});

					const postMap = new Map(data.posts.map((view) => [view.uri, view]));

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
