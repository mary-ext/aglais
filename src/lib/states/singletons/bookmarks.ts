import type { IDBPDatabase } from 'idb';
import { onCleanup } from 'solid-js';

import type { BookmarkDBSchema } from '~/lib/aglais-bookmarks/db';
import { assert } from '~/lib/utils/invariant';

import { useSession } from '../session';

const BookmarksService = () => {
	const { currentAccount } = useSession();

	let promise: Promise<IDBPDatabase<BookmarkDBSchema>> | undefined;

	onCleanup(() => {
		if (!promise) {
			return;
		}

		const held = promise;
		promise = undefined;

		held.then((db) => db.close());
	});

	return {
		open(): Promise<IDBPDatabase<BookmarkDBSchema>> {
			if (promise !== undefined) {
				return promise;
			}

			assert(currentAccount !== undefined, `Can't open database when not signed in`);

			return (promise = (async (): Promise<IDBPDatabase<BookmarkDBSchema>> => {
				const { openDB } = await import('idb');

				const db = await openDB<BookmarkDBSchema>(`aglais-bookmarks-${currentAccount.did}`, 1, {
					async upgrade(db, oldVersion) {
						if (oldVersion < 1) {
							const tagsStore = db.createObjectStore('tags', { keyPath: 'id' });
							const bookmarksStore = db.createObjectStore('bookmarks', { keyPath: 'view.uri' });

							tagsStore.createIndex('created_at', 'created_at');

							bookmarksStore.createIndex('bookmarked_at', 'bookmarked_at');
							bookmarksStore.createIndex('tags', 'tags', { multiEntry: true });
						}
					},
				});

				return db;
			})());
		},
	};
};

export default BookmarksService;
