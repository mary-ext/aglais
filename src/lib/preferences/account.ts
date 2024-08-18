import type { At } from '@atcute/client/lexicons';

import type { ModerationLabeler, ModerationPreferences } from '~/api/moderation';

export interface PerAccountPreferenceSchema {
	$version: 1;
	feeds: SavedFeed[];
	composer: ComposerPreferences;
	translation: ContentTranslationPreferences;
	threadView: ThreadViewPreferences;
	moderation: ModerationPreferences;
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

export interface ComposerPreferences {
	/** Default language to use when composing a new post */
	defaultPostLanguage: 'none' | 'system' | (string & {});
	/** Default reply gate when creating a new thread */
	defaultReplyGate: 'everyone' | 'follows' | 'mentions';
}

export interface ContentTranslationPreferences {
	/** Whether translations are enabled */
	enabled: boolean;
	/** Whether translations should be proxied */
	proxy: boolean;
	/** Translate content to this language */
	to: 'system' | (string & {});
	/** Don't offer to translate on these languages */
	exclusions: string[];
}
