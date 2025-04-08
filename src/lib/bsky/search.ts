import type { Token } from '@atcute/bluesky-search-parser';

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
		query && (query += ' ');
		query += token.value;
	}

	if (filters !== undefined) {
		for (const [op, value] of filters) {
			query && (query += ' ');
			query += `${op}:${value}`;
		}
	}

	return query;
};

const PARTIAL_DATE_RE =
	/^((?!0{3})\d{4})(?:-(0[1-9]|1[0-2])(?:-(0[1-9]|[12]\d|3[01])(?:T([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d)(?:\.(\d+))?)?(Z|(?!-00:00)[+-](?:[01]\d|2[0-3]):(?:[0-5]\d))?)?)?)?$/;

export const parseStartDate = (str: string): Date | null => {
	const match = PARTIAL_DATE_RE.exec(str);
	if (match === null) {
		return null;
	}

	const [
		_,
		year,
		month = '01',
		day = '01',
		hour = '23',
		minutes = '59',
		seconds = '59',
		miliseconds = '999',
		tz = '',
	] = match;

	// if timezone is empty, local time is assumed.
	const d = new Date(`${year}-${month}-${day}T${hour}:${minutes}:${seconds}.${miliseconds}${tz}`);

	return d;
};

export const parseEndDate = (str: string): Date | null => {
	const match = PARTIAL_DATE_RE.exec(str);
	if (match === null) {
		return null;
	}

	const [
		_,
		year,
		month = undefined,
		day = undefined,
		hour = '23',
		minutes = '59',
		seconds = '59',
		miliseconds = '999',
		tz = '',
	] = match;

	// if timezone is empty, local time is assumed.
	const d = new Date(`${year}-01-01T${hour}:${minutes}:${seconds}.${miliseconds}${tz}`);

	if (month === undefined) {
		d.setMonth(11, 31);
	} else if (day === undefined) {
		d.setMonth(+month, 0);
	} else {
		d.setMonth(+month - 1, +day);
	}

	return d;
};
