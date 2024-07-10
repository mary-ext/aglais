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
				const item = await db.get('bookmarks', $postUri);

				return { item };
			},
			initialData: {
				item: undefined,
			},
		};
	});

	return entry;
};
