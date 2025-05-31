import { unwrap } from 'solid-js/store';

import type { AppBskyEmbedDefs, AppBskyEmbedExternal, AppBskyFeedDefs } from '@atcute/bluesky';
import type { $type, Blob as AtpBlob } from '@atcute/lexicons';

import { primarySystemLanguage } from '~/globals/locales';

import type { ComposerPreferences } from '~/lib/preferences/account';
import {
	type PostgateState,
	type ThreadgateState,
	fromPersistedPostgate,
	fromPersistedThreadgate,
} from '~/lib/preferences/snippets/composer';

import type { GifMedia } from '../gifs/gif-search-dialog';

import { type ParsedRichText, parseRichText } from './richtext';

// Embeds
export interface PostGifEmbed {
	type: 'gif';
	gif: GifMedia;
	/** User-provided alt, undefined if not provided. */
	alt?: string;
}

export interface LocalMediaSource {
	type: 'local';
	blob: Blob;
	aspectRatio?: AppBskyEmbedDefs.AspectRatio;
}

export interface RemoteMediaSource {
	type: 'remote';
	blob: AtpBlob;
	aspectRatio?: AppBskyEmbedDefs.AspectRatio;
}

export type MediaSource = LocalMediaSource | RemoteMediaSource;

export interface PostImage {
	source: MediaSource;
	alt: string;
}

export interface PostImageEmbed {
	type: 'image';
	images: PostImage[];
	labels: string[];
}

export interface PostVideoEmbed {
	type: 'video';
	source: MediaSource;
	alt: string;
	labels: string[];
}

export type PostMediaEmbed = PostGifEmbed | PostImageEmbed | PostVideoEmbed;

export interface PostFeedEmbed {
	type: 'feed';
	uri: string;
}

export interface PostListEmbed {
	type: 'list';
	uri: string;
}

export interface PostQuoteEmbed {
	type: 'quote';
	uri: string;
	origin: boolean;
}

export type PostRecordEmbed = PostFeedEmbed | PostListEmbed | PostQuoteEmbed;

export interface UriLinkSource {
	type: 'uri';
	uri: string;
}

export interface RemoteLinkSource {
	type: 'remote';
	state: $type.enforce<AppBskyEmbedExternal.Main>;
}

export type LinkSource = UriLinkSource | RemoteLinkSource;

export interface PostLinkEmbed {
	source: LinkSource;
	labels: string[];
}

export interface PostEmbed {
	media?: PostMediaEmbed;
	record?: PostRecordEmbed;
	link?: PostLinkEmbed;
}

/** Returns amount of images, if an image embed is present */
export function getImageCount(embed: PostEmbed): number {
	const media = embed.media;

	if (media && media.type === 'image') {
		return media.images.length;
	}

	return 0;
}

/** Retrieves labels from external and image embeds, if one is present */
export function getEmbedLabels(embed: PostEmbed): string[] | undefined {
	const media = embed.media;
	if (media && (media.type === 'image' || media.type === 'video')) {
		return media.labels;
	}

	const link = embed.link;
	if (link) {
		return link.labels;
	}
}

/** Determine if any images or GIFs are missing alt text, if one is present */
export function isAltTextMissing(embed: PostEmbed): boolean {
	const media = embed.media;

	if (media) {
		if (media.type === 'image') {
			return media.images.some((i) => i.alt.length === 0);
		}

		if (media.type === 'video') {
			return media.alt.length === 0;
		}

		if (media.type === 'gif') {
			return media.alt === undefined;
		}
	}

	return false;
}

// Post state
export interface PostState {
	text: string;
	languages: string[];
	embed: PostEmbed;

	_parsed: ParsedPost | null;
}

interface ParsedPost {
	text: string;
	rt: ParsedRichText;
}

export const getPostRt = (post: PostState) => {
	const unwrapped = unwrap(post);

	const text = post.text;
	const existing = unwrapped._parsed;

	if (existing === null || existing.text !== text) {
		return (unwrapped._parsed = { text: text, rt: parseRichText(text) }).rt;
	}

	return existing.rt;
};

export interface CreatePostStateOptions {
	text?: string;
	embed?: PostEmbed;
	languages?: string[];
}

export function createPostState({
	text = '',
	embed = {},
	languages = [],
}: CreatePostStateOptions = {}): PostState {
	return {
		text: text,
		embed: embed,
		languages: languages,

		_parsed: null,
	};
}

// Composer state
export interface CreateComposerStateOptions {
	replyUri?: string;
	text?: string;
	quote?: AppBskyFeedDefs.PostView;
	languages?: string[];
}

export interface ComposerState {
	active: number;
	replyUri: string | undefined;
	redraftUri: string | undefined;
	posts: PostState[];
	threadgate: ThreadgateState;
	postgate: PostgateState;
}

export function createComposerState(
	{ replyUri, text, quote }: CreateComposerStateOptions = {},
	{ language, threadgate, postgate }: ComposerPreferences,
): ComposerState {
	return {
		active: 0,
		replyUri: replyUri,
		redraftUri: undefined,
		posts: [
			createPostState({
				text,
				embed: {
					record: quote
						? {
								type: 'quote',
								uri: quote.uri,
								origin: true,
							}
						: undefined,
				},
				languages: resolveDefaultLanguage(language),
			}),
		],
		threadgate: fromPersistedThreadgate(threadgate),
		postgate: fromPersistedPostgate(postgate),
	};
}

const resolveDefaultLanguage = (lang: 'none' | 'system' | (string & {})) => {
	if (lang === 'none') {
		return [];
	}

	if (lang === 'system') {
		return [primarySystemLanguage];
	}

	return [lang];
};
