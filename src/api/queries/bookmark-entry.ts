import { createQuery } from '@mary/solid-query';

import { useBookmarks } from '~/lib/states/bookmarks';

export const createBookmarkEntryQuery = (postUri: () => string) => {
	const bookmarks = useBookmarks();

	const entry = createQuery(() => {
		const $postUri = postUri();

		return {
			queryKey: ['bookmark-entry', $postUri],
			async queryFn() {
				const db = await bookmarks.open();
				const entry = db.get('bookmarks', $postUri);

				if (!entry) {
					throw new Error(`Bookmark not found`);
				}

				return entry;
			},
		};
	});

	return entry;
};
