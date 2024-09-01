import { createContext, onCleanup, useContext, type ParentProps } from 'solid-js';

import { openDB, type IDBPDatabase } from 'idb';

import { assert } from '../invariant';

import { useSession } from './session';

import type { BookmarkDBSchema } from '../aglais-bookmarks/db';

export interface BookmarkContext {
	open(): Promise<IDBPDatabase<BookmarkDBSchema>>;
}

const Context = createContext<BookmarkContext>();

export const BookmarksProvider = (props: ParentProps) => {
	const { currentAccount } = useSession();

	let promise: Promise<IDBPDatabase<BookmarkDBSchema>> | undefined;
	const context: BookmarkContext = {
		open(): Promise<IDBPDatabase<BookmarkDBSchema>> {
			if (promise !== undefined) {
				return promise;
			}

			assert(currentAccount !== undefined, `Can't open database when not signed in`);

			return (promise = (async (): Promise<IDBPDatabase<BookmarkDBSchema>> => {
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

	onCleanup(() => {
		if (!promise) {
			return;
		}

		const held = promise;
		promise = undefined;

		held.then((db) => db.close());
	});

	return <Context.Provider value={context}>{props.children}</Context.Provider>;
};

export const useBookmarks = (): BookmarkContext => {
	const bookmarks = useContext(Context);
	assert(bookmarks !== undefined, `Expected useBookmarks to be called under <BookmarksProvider>`);

	return bookmarks;
};
