import { createInfiniteQuery, createQuery } from '@mary/solid-query';

import type { BookmarkItem, HydratedBookmarkItem } from '~/lib/aglais-bookmarks/db';
import { filter, map, take, toArray } from '~/lib/async-iterators';
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

				let raws: BookmarkItem[];
				let last: BookmarkItem | undefined;

				// Retrieve bookmarks from store
				{
					const tx = db.transaction('bookmarks', 'readonly');
					const bookmarksStore = tx.objectStore('bookmarks');

					const query = pageParam !== undefined ? IDBKeyRange.upperBound(pageParam, true) : undefined;
					const curs = bookmarksStore.index('bookmarked_at').iterate(query, 'prev');

					let iterator = map(curs, (c) => (last = c.value));

					if ($tagId !== 'all') {
						iterator = filter(iterator, (entry) => entry.tags.includes($tagId));
					}

					raws = await toArray(take(iterator, limit));
				}

				let hydrated: HydratedBookmarkItem[] = [];

				// Retrieve live view
				if (raws.length) {
					const { data } = await rpc.get('app.bsky.feed.getPosts', {
						signal: ctx.signal,
						params: {
							uris: raws.map((item) => item.view.uri),
						},
					});

					const postMap = new Map(data.posts.map((view) => [view.uri, view]));
					hydrated = raws.map((item) => {
						const hydratedView = postMap.get(item.view.uri);

						return {
							post: hydratedView ?? item.view,
							stale: !hydratedView,
							bookmarkedAt: item.bookmarked_at,
						};
					});
				}

				return {
					cursor: raws.length >= limit ? last?.bookmarked_at : undefined,
					items: hydrated,
				};
			},
			initialPageParam: undefined as number | undefined,
			getNextPageParam: (last) => last.cursor,
		};
	});

	return listing;
};
