import type { AppBskyEmbedExternal } from '@mary/bluesky-client/lexicons';

import { safeUrlParse } from '~/api/utils/strings';

export const enum SnippetType {
	LINK,
	BLUESKY_GIF,
	IFRAME,
}

export const enum SnippetSource {
	YOUTUBE,
	SOUNDCLOUD,
}

export interface LinkSnippet {
	type: SnippetType.LINK;
	/** Domain name */
	domain?: string;
}

export interface BlueskyGifSnippet {
	type: SnippetType.BLUESKY_GIF;
	/** GIF video URL */
	url: string;
	/** GIF thumbnail URL */
	thumb: string | undefined;
	/** Aspect ratio */
	ratio: string;
	/** Alt text description */
	description: string;
}

export interface IframeSnippet {
	type: SnippetType.IFRAME;
	/** Source type */
	source: SnippetSource;
	/** Source domain */
	domain: string;
	/** Iframe URL */
	url: string;
	/** Aspect ratio */
	ratio: string;
}

export type Snippet = LinkSnippet | BlueskyGifSnippet | IframeSnippet;

export const detectSnippet = (link: AppBskyEmbedExternal.ViewExternal, linkOnly = false): Snippet => {
	const url = link.uri;
	const u = safeUrlParse(url);

	if (u === null) {
		return { type: SnippetType.LINK };
	}

	const h = u.host;
	const p = u.pathname;
	const q = u.searchParams;

	const d = h.startsWith('www.') ? h.slice(4) : h;

	let m: RegExpExecArray | null | undefined;

	if (linkOnly) {
		return {
			type: SnippetType.LINK,
			domain: d,
		};
	}

	if (d === 'media.tenor.com') {
		// Bluesky GIFs
		if ((m = /\/([^/]+?AAAAC)\/([^/]+?)\?hh=(\d+?)&ww=(\d+?)$/.exec(url))) {
			const file = m[2].replace(/\.gif$/, '');

			const width = m[4];
			const height = m[3];

			return {
				type: SnippetType.BLUESKY_GIF,
				// AAAP3 -> tinywebm
				url: `https://t.gifs.bsky.app/${m[1].replace(/AAAAC$/, 'AAAP3')}/${file}`,
				// AAAAT -> nanogifpreview
				thumb: `https://t.gifs.bsky.app/${m[1].replace(/AAAAC$/, 'AAAAT')}/${file}`,
				ratio: `${width}/${height}`,
				description: link.description.replace(/^(ALT|Alt): /, ''),
			};
		}
	} else if (d === 'youtube.com' || d === 'm.youtube.com' || d === 'music.youtube.com') {
		// YouTube iframe
		if (p === '/watch') {
			const videoId = q.get('v');
			const seek = q.get('t') || 0;

			return {
				type: SnippetType.IFRAME,
				source: SnippetSource.YOUTUBE,
				domain: d,
				url: `https://www.youtube-nocookie.com/embed/${videoId}?start=${seek}&autoplay=1&playsinline=1`,
				ratio: d !== 'music.youtube.com' ? `16/9` : `1`,
			};
		}
	} else if (d === 'youtu.be') {
		// YouTube iframe
		if ((m = /^\/([^/]+?)$/.exec(p))) {
			const videoId = m[1];
			const seek = encodeURIComponent(q.get('t') || 0);

			return {
				type: SnippetType.IFRAME,
				source: SnippetSource.YOUTUBE,
				domain: d,
				url: `https://www.youtube-nocookie.com/embed/${videoId}?start=${seek}&autoplay=1&playsinline=1`,
				ratio: `16/9`,
			};
		}
	} else if (d === 'soundcloud.com' || d === 'www.soundcloud.com') {
		// SoundCloud embed
		if ((m = /^\/([^/]+?)(?:\/(?!reposts$)([^/]+?)|\/sets\/([^/]+?))?$/.exec(p))) {
			return {
				type: SnippetType.IFRAME,
				source: SnippetSource.SOUNDCLOUD,
				domain: d,
				url: `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&auto_play=true&visual=false&hide_related=true`,
				ratio: m[3] ? `1/1` : `16/9`,
			};
		}
	}

	{
		// Link snippet, always matches
		return {
			type: SnippetType.LINK,
			domain: d,
		};
	}
};
