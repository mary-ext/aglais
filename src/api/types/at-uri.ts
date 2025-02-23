import type { At, Records } from '@atcute/client/lexicons';

import { assert } from '~/lib/utils/invariant';

export const ATURI_RE =
	/^at:\/\/(did:[a-z]+:[a-zA-Z0-9._:%\-]*[a-zA-Z0-9._\-]|(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])\/([a-zA-Z0-9-.]+)\/((?!\.{1,2}$)[a-zA-Z0-9_~.:-]{1,512})(?:#(\/[a-zA-Z0-9._~:@!$&%')(*+,;=\-[\]/\\]*))?$/;

export interface ParsedAtUri {
	repo: string;
	collection: string;
	rkey: string;
	fragment: string | undefined;
}

export const parseAtUri = (str: string): ParsedAtUri => {
	const match = ATURI_RE.exec(str);
	assert(match !== null, `failed to parse at-uri for ${str}`);

	return {
		repo: match[1] as At.DID,
		collection: match[2],
		rkey: match[3],
		fragment: match[4],
	};
};

export const makeAtUri = (repo: string, collection: keyof Records | (string & {}), rkey: string) => {
	return `at://${repo}/${collection}/${rkey}`;
};
