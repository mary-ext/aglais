import type { DBSchema } from 'idb';

import type { AppBskyFeedDefs } from '@mary/bluesky-client/lexicons';

export interface BookmarkDBSchema extends DBSchema {
	tags: {
		key: number;
		value: TagItem;
		indexes: {
			created_at: number;
		};
	};
	bookmarks: {
		key: string;
		value: BookmarkItem;
		indexes: {
			bookmarked_at: number;
			'tags,bookmarked_at': [tag: number, bookmarked_at: number];
			tags: number;
		};
	};
}

export interface TagItem {
	id: number;
	name: string;
	created_at: number;
}

export interface BookmarkItem {
	view: AppBskyFeedDefs.PostView;
	bookmarked_at: number;
	tags: number[];
}

export interface HydratedBookmarkItem {
	post: AppBskyFeedDefs.PostView;
	stale: boolean;
	bookmarkedAt: number;
}
