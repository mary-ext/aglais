import { createQuery } from '@mary/solid-query';

import type { TagItem } from '~/lib/aglais-bookmarks/db';
import { useBookmarks } from '~/lib/states/bookmarks';

export interface HydratedTagItem extends TagItem {
	count: number;
}

export const createBookmarkMetaQuery = () => {
	const bookmarks = useBookmarks();

	const query = createQuery(() => {
		return {
			queryKey: ['bookmark-meta'],
			async queryFn() {
				const db = await bookmarks.open();
				const tx = db.transaction(['tags', 'bookmarks'], 'readonly');

				const tags = await tx.objectStore('tags').getAll();
				const bookmarksStore = tx.objectStore('bookmarks');

				const [totalCount, ...counts] = await Promise.all([
					bookmarksStore.count(),
					...tags.map((tag) => {
						return bookmarksStore.index('tags').count(tag.id);
					}),
				]);

				const hydrated = tags.map((tag, idx): HydratedTagItem => {
					return {
						...tag,
						count: counts[idx],
					};
				});

				return { totalCount, tags: hydrated };
			},
		};
	});

	return query;
};
