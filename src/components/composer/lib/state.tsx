import { unwrap } from 'solid-js/store';

import { type Token as RichToken, tokenize } from '@atcute/bluesky-richtext-parser';
import type { AppBskyEmbedDefs, At } from '@atcute/client/lexicons';
import type { AppBskyFeedDefs } from '@atcute/client/lexicons';

import { graphemeLen } from '~/api/utils/unicode';
import { toShortUrl } from '~/api/utils/url';

import { primarySystemLanguage } from '~/globals/locales';

import type { ComposerPreferences } from '~/lib/preferences/account';
import {
	type PostgateState,
	type ThreadgateState,
	fromPersistedPostgate,
	fromPersistedThreadgate,
} from '~/lib/preferences/snippets/composer';

import type { GifMedia } from '../gifs/gif-search-dialog';

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
	blob: At.Blob;
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

export interface PostLinkEmbed {
	uri: string;
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

// Rich text parser
export interface ParsedRichText {
	tokens: RichToken[];
	length: number;
	empty: boolean;
}

const S_RE = /^\s+$/;
const reduceTokenLength = (accu: number, token: RichToken) => accu + graphemeLen(token.raw);

export const parseRichText = (text: string): ParsedRichText => {
	const tokens = tokenize(text);

	// We're just going to make use of `raw` as our definitive source of truth
	// since we're not using them for anything else.
	for (let idx = 0, len = tokens.length; idx < len; idx++) {
		const token = tokens[idx];
		const type = token.type;

		if (type === 'autolink') {
			token.raw = toShortUrl(token.url);
		} else if (type === 'emote') {
			token.raw = '◌';
		} else if (type === 'link') {
			token.raw = token.text;
		} else if (type === 'escape') {
			token.raw = token.escaped;
		}
	}

	return {
		tokens: tokens,
		length: tokens.reduce(reduceTokenLength, 0),
		empty: text.length === 0 || S_RE.test(text),
	};
};

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
