import type { DBSchema } from 'idb';

import type { AppBskyFeedDefs } from '@mary/bluesky-client/lexicons';

export interface BookmarkDBSchema extends DBSchema {
	tags: {
		key: string;
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
			tags: string;
		};
	};
}

export interface TagItem {
	id: string;
	name: string;
	color: string | undefined;
	icon: string | undefined;
	created_at: number;
}

export interface BookmarkItem {
	view: AppBskyFeedDefs.PostView;
	bookmarked_at: number;
	tags: string[];
}

export interface HydratedBookmarkItem {
	post: AppBskyFeedDefs.PostView;
	stale: boolean;
	bookmarkedAt: number;
}
