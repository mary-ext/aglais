import type { AppBskyFeedDefs, AppBskyGraphDefs, At } from '@atcute/client/lexicons';

import type { ModerationLabeler, ModerationPreferences } from '~/api/moderation';

export interface PerAccountPreferenceSchema {
	$version: 1;
	ui: UIPreferences;
	feeds: SavedFeed[];
	composer: ComposerPreferences;
	translation: ContentTranslationPreferences;
	threadView: ThreadViewPreferences;
	moderation: ModerationPreferences;
}

export interface UIPreferences {
	/** Media player volume */
	mediaVolume: number;
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
	definitions: Record<At.Did, ModerationLabeler>;
}

export type SavedFeed = SavedGeneratorFeed | SavedListFeed | SavedSearchFeed;

export interface SavedGeneratorFeed {
	readonly type: 'generator';
	pinned: boolean;
	info: AppBskyFeedDefs.GeneratorView;
}

export interface SavedListFeed {
	readonly type: 'list';
	pinned: boolean;
	info: AppBskyGraphDefs.ListView;
}

export interface SavedSearchFeed {
	readonly type: 'search';
	name: string;
	query: string;
	kind: string;
}

export interface PersistedThreadgate {
	allow?: Array<
		{ type: 'following' } | { type: 'follower' } | { type: 'mention' } | { type: 'list'; uri: At.ResourceUri }
	>;
}

export interface PersistedPostgate {
	embeddingRules?: Array<{ type: 'disable' }>;
}

export interface ComposerPreferences {
	/** Default language to use when composing a new post */
	language: 'none' | 'system' | (string & {});
	/** Default thread gate when creating a thread */
	threadgate: PersistedThreadgate;
	/** Default post gate when creating a post */
	postgate: PersistedPostgate;
}

export interface ContentTranslationPreferences {
	/** Whether translations are enabled */
	enabled: boolean;
	/** URLs to Basa translate proxy instances */
	instances: string[];
	/** Translate content to this language */
	to: 'system' | (string & {});
	/** Don't offer to translate on these languages */
	exclusions: string[];
}
