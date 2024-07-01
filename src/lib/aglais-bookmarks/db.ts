import type { DBSchema } from 'idb';

import type { AppBskyFeedDefs } from '@mary/bluesky-client/lexicons';

export interface BookmarkDBSchema extends DBSchema {
	tags: {
		key: number;
		value: {
			id: number;
			name: string;
			created_at: number;
		};
		indexes: {
			created_at: number;
		};
	};
	bookmarks: {
		key: string;
		value: {
			view: AppBskyFeedDefs.PostView;
			bookmarked_at: number;
			tags: number[];
		};
		indexes: {
			bookmarked_at: number;
			'tags,bookmarked_at': [tag: number, bookmarked_at: number];
			tags: number;
		};
	};
}
