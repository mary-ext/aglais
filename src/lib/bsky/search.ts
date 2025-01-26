import type { Token } from '@atcute/bluesky-search-parser';

// https://github.com/golang/go/blob/519f6a00e4dabb871eadaefc8ac295c09fd9b56f/src/strings/strings.go#L377-L425
export const fieldsfunc = (str: string, fn: (rune: number) => boolean): string[] => {
	const slices: string[] = [];

	let start = -1;
	for (let pos = 0, len = str.length; pos < len; pos++) {
		if (fn(str.charCodeAt(pos))) {
			if (start !== -1) {
				slices.push(str.slice(start, pos));
				start = -1;
			}
		} else {
			if (start === -1) {
				start = pos;
			}
		}
	}

	if (start !== -1) {
		slices.push(str.slice(start));
	}

	return slices;
};

export const tokenizeSearchQuery = (query: string): string[] => {
	// https://github.com/bluesky-social/indigo/blob/421e4da5307f4fcba51f25b5c5982c8b9841f7f6/search/parse_query.go#L15-L21
	let quoted = false;

	const tokens = fieldsfunc(query, (rune) => {
		if (rune === 34) {
			quoted = !quoted;
		}

		return rune === 32 && !quoted;
	});

	return tokens;
};

const OPERATOR_RE = /^([a-z-]+):(.*)$/;

export const splitFilters = (tokens: Token[]): [remains: Token[], filters: Map<string, string>] => {
	const filters = new Map<string, string>();
	const remaining: Token[] = [];

	for (let idx = 0, len = tokens.length; idx < len; idx++) {
		const token = tokens[idx];

		switch (token.type) {
			case 'word': {
				const match = OPERATOR_RE.exec(token.value);
				if (match) {
					filters.set(match[1], match[2]);
					break;
				}

				remaining.push(token);
				break;
			}
			case 'whitespace': {
				remaining.push(token);
				break;
			}
			case 'quoted': {
				remaining.push(token);
				break;
			}
		}
	}

	return [remaining, filters];
};

export const stringifySearch = (tokens: Token[], filters?: Map<string, string>): string => {
	let query = '';

	for (const token of tokens) {
		query += token.value;
	}

	if (filters !== undefined) {
		for (const [op, value] of filters) {
			query += ` ${op}:${value}`;
		}
	}

	return query;
};
