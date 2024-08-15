import type { AppBskyFeedDefs, AppBskyFeedPost } from '@mary/bluesky-client/lexicons';
import { DID_RE, HANDLE_RE } from '~/api/utils/strings';

const SIMPLE_DATE_RE = /^\d{4}-[01]\d-[0-3]\d$/;

export const createSearchPredicate = (tokens: string[]) => {
	const filters: ((post: AppBskyFeedDefs.PostView) => boolean)[] = [];

	const substrings: string[] = [];
	let from: string | undefined;
	let before: number | undefined;
	let until: number | undefined;

	for (let idx = 0, len = tokens.length; idx < len; idx++) {
		const token = tokens[idx];

		if (token[0] === '"') {
			let end = token.length;
			if (token[end - 1] === '"') {
				end--;
			}

			substrings.push(token.slice(1, end));
			continue;
		}

		const [op, value] = token.split(':');
		if (!value) {
			substrings.push(token);
			continue;
		}

		if (op === 'before' || op === 'until') {
			let date: Date;

			if (SIMPLE_DATE_RE.test(value)) {
				const [year, month, day] = value.split('-');

				if (op === 'before') {
					date = new Date(+year, +month - 1, +day);
				} else {
					date = new Date(+year, +month - 1, +day, 23, 59, 59, 999);
				}
			} else {
				date = new Date(value);
			}

			const time = date.getTime();
			const coerced = !Number.isNaN(time) ? time : undefined;

			if (op === 'before') {
				before = coerced;
			} else {
				until = coerced;
			}
		} else if (op === 'from') {
			from = HANDLE_RE.test(value) ? value : undefined;
		} else if (op === 'did') {
			from = DID_RE.test(value) ? value : undefined;
		} else {
			substrings.push(token);
		}
	}

	if (from !== undefined) {
		filters.push((post) => {
			const author = post.author;
			return author.handle === from || author.did === from;
		});
	}

	if (before !== undefined || until !== undefined) {
		filters.push((post) => {
			const date = new Date(post.indexedAt).getTime();

			if (Number.isNaN(date)) {
				return false;
			}

			return (before === undefined || date >= before) && (until === undefined || date <= until);
		});
	}

	if (substrings.length !== 0) {
		const re = new RegExp('\\b' + substrings.map(escape).join('|') + '\\b', 'i');
		filters.push((post) => re.test((post.record as AppBskyFeedPost.Record).text));
	}

	return (post: AppBskyFeedDefs.PostView) => filters.every((fn) => fn(post));
};

const escape = (str: string) => {
	return str.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
};
