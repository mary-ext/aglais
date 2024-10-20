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
	definitions: Record<At.DID, ModerationLabeler>;
}

export type SavedFeed = SavedGeneratorFeed | SavedListFeed;

export interface SavedGeneratorFeed {
	readonly type: 'generator';
	readonly uri: string;
	pinned: boolean;
	info: AppBskyFeedDefs.GeneratorView;
}

export interface SavedListFeed {
	readonly type: 'list';
	readonly uri: string;
	pinned: boolean;
	info: AppBskyGraphDefs.ListView;
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
	/** URLs to Basa translate proxy instances */
	instances: string[];
	/** Translate content to this language */
	to: 'system' | (string & {});
	/** Don't offer to translate on these languages */
	exclusions: string[];
}
