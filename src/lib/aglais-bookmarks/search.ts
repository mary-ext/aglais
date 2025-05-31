import type { AppBskyFeedDefs, AppBskyFeedPost } from '@atcute/bluesky';
import type { Token } from '@atcute/bluesky-search-parser';
import { mapDefined } from '@mary/array-fns';

import { DID_RE, HANDLE_RE } from '~/api/types/identity';

import { parseEndDate, parseStartDate, splitFilters } from '../bsky/search';
import { escapeRegex } from '../utils/regex';

export const createSearchPredicate = (tokens: Token[]) => {
	const [substrings, filters] = splitFilters(tokens);
	const predicates: ((post: AppBskyFeedDefs.PostView) => boolean)[] = [];

	if (filters.has('since') || filters.has('until')) {
		let since: number | undefined;
		let until: number | undefined;

		{
			const raw = filters.get('since');
			const parsed = raw ? parseStartDate(raw) : null;
			since = parsed?.getTime();
		}

		{
			const raw = filters.get('until');
			const parsed = raw ? parseEndDate(raw) : null;
			until = parsed?.getTime();
		}

		if (since !== undefined || until !== undefined) {
			predicates.push((post) => {
				const date = new Date(post.indexedAt).getTime();
				if (Number.isNaN(date)) {
					return false;
				}

				return (since === undefined || date >= since) && (until === undefined || date <= until);
			});
		}
	}

	if (filters.has('from') || filters.has('did')) {
		let from: string | undefined;

		{
			const raw = filters.get('from');
			if (raw && HANDLE_RE.test(raw)) {
				from = raw;
			}
		}

		{
			const raw = filters.get('did');
			if (raw && DID_RE.test(raw)) {
				from = raw;
			}
		}

		if (from !== undefined) {
			predicates.push((post) => {
				const author = post.author;
				return author.handle === from || author.did === from;
			});
		}
	}

	if (substrings.length > 0) {
		const values = mapDefined(substrings, (token) => {
			switch (token.type) {
				case 'word': {
					return escapeRegex(token.value);
				}
				case 'quoted': {
					const quote = token.value;
					let end = quote.length;

					if (quote.charCodeAt(end - 1) === 34) {
						end--;
					}

					return escapeRegex(quote.slice(1, end));
				}
			}
		});

		const re = new RegExp('\\b' + values.join('|') + '\\b', 'i');
		predicates.push((post) => re.test((post.record as AppBskyFeedPost.Main).text));
	}

	return (post: AppBskyFeedDefs.PostView) => predicates.every((fn) => fn(post));
};
