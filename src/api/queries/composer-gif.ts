import { createInfiniteQuery, keepPreviousData, type InfiniteData } from '@mary/solid-query';

const GIF_ENDPOINT = `https://gifs.bsky.app`;

const selectFn = (data: InfiniteData<TenorResponse, string | undefined>) => {
	return data.pages.map((page) => page.results);
};

export const createGifSearchQuery = (search: () => string) => {
	return createInfiniteQuery(() => {
		const $search = search().replace(/^\s+|\s+$|(?<=\s)\s+/g, '');

		return {
			queryKey: ['search-gifs', $search],
			queryFn({ pageParam, signal }) {
				if ($search === '') {
					return fetchTenor({
						uri: `${GIF_ENDPOINT}/tenor/v2/featured`,
						params: { pos: pageParam },
						signal: signal,
					});
				} else {
					return fetchTenor({
						uri: `${GIF_ENDPOINT}/tenor/v2/search`,
						params: { pos: pageParam, q: $search },
						signal: signal,
					});
				}
			},
			initialPageParam: undefined as string | undefined,
			getNextPageParam: (last) => last.next,
			placeholderData: keepPreviousData,
			structuralSharing: false,
			select: selectFn,
		};
	});
};

const fetchTenor = async ({ uri, params, signal }: FetchTenorOptions): Promise<TenorResponse> => {
	const defaultedParams: Record<string, string | number | undefined> = {
		client_key: 'bluesky-web',
		contentfilter: 'high',
		// media_filter: ['gif'].join(','),
		locale: navigator.language.replace('-', '_'),
		limit: 30,
		...params,
	};

	const searchParams = new URLSearchParams();
	for (const key in defaultedParams) {
		const value = defaultedParams[key];
		if (value !== undefined) {
			searchParams.set(key, '' + value);
		}
	}

	const finalUri = `${uri}?${searchParams.toString()}`;

	const response = await fetch(finalUri, {
		signal: signal,
		headers: {
			'Content-Type': 'application/json',
		},
	});

	if (!response.ok) {
		throw new Error(`Response error ${response.status}`);
	}

	return await response.json();
};

export interface TenorResponse {
	next: string;
	results: Gif[];
}

interface FetchTenorOptions {
	uri: string;
	params: Record<string, string | number | undefined>;
	signal?: AbortSignal;
}

export interface Gif {
	/** Unix timestamp of GIF creation time */
	created: number;
	/** GIF contains audio */
	hasaudio: boolean;
	/** Tenor GIF identifier */
	id: string;
	/** Record of content formats */
	media_formats: Record<ContentFormats, MediaObject>;
	/** Associated tags */
	tags: string[];
	/** GIF title */
	title: string;
	/** GIF description */
	content_description: string;
	/** Full URL on tenor.com */
	itemurl: string;
	/** GIF contains caption */
	hascaption: boolean;
	/** Comma-separated list of metadata about the GIF */
	flags: string;
	/** Common background color of the content */
	bg_color?: string;
	/** Short URL on tenor.com */
	url: string;
}

interface MediaObject {
	/** URL to media */
	url: string;
	/** Width and height dimensions in pixels */
	dims: [number, number];
	/** Media duration in seconds, 0 if static */
	duration: number;
	/** Size of media in bytes */
	size: number;
}

type ContentFormats = 'gif';
