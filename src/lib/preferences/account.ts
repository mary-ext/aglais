import type { At } from '@mary/bluesky-client/lexicons';

import type { ModerationLabeler, ModerationPreferences } from '~/api/moderation';

export interface PerAccountPreferenceSchema {
	$version: 1;
	feeds: SavedFeed[];
	language: LanguagePreferences;
	moderation: ModerationPreferences;
	threadView: ThreadViewPreferences;
}

export interface ThreadViewPreferences {
	/** Show replies from followed users first */
	followsFirst: boolean;
	/** How it should order the replies */
	sort: 'oldest' | 'newest' | 'most-likes' | 'clout';
	/** Experimental tree view */
	treeView: boolean;
}

export interface ModerationLabelerPreferences {
	updated: number;
	definitions: Record<At.DID, ModerationLabeler>;
}

export interface SavedFeed {
	readonly uri: string;
	pinned: boolean;
	info: SavedFeedInfo;
	avatar?: string;
	indexedAt?: string;
}

export interface SavedFeedInfo {
	name: string;
	avatar?: string;
	acceptsInteraction?: boolean;
	indexedAt?: string;
}

export interface LanguagePreferences {
	/** Default language to use when composing a new post */
	defaultPostLanguage: 'none' | 'system' | (string & {});
}
