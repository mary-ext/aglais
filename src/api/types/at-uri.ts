import type { At, Records } from '@atcute/client/lexicons';

import { assert } from '~/lib/utils/invariant';

export const ATURI_RE =
	/^at:\/\/(did:[a-z]+:[a-zA-Z0-9._:%\-]*[a-zA-Z0-9._\-]|(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])\/([a-zA-Z0-9-.]+)\/((?!\.{1,2}$)[a-zA-Z0-9_~.:-]{1,512})(?:#(\/[a-zA-Z0-9._~:@!$&%')(*+,;=\-[\]/\\]*))?$/;

export interface ParsedCanonicalResourceUri {
	repo: At.Did;
	collection: At.Nsid;
	rkey: At.RecordKey;
	fragment: string | undefined;
}

export const parseCanonicalResourceUri = (str: string): ParsedCanonicalResourceUri => {
	const match = ATURI_RE.exec(str);
	assert(match !== null, `failed to parse canonical-at-uri for ${str}`);

	return {
		repo: match[1] as At.Did,
		collection: match[2] as At.Nsid,
		rkey: match[3] as At.RecordKey,
		fragment: match[4],
	};
};

export const makeAtUri = (
	repo: At.Identifier,
	collection: keyof Records | (string & {}),
	rkey: At.RecordKey,
): At.ResourceUri => {
	return `at://${repo}/${collection}/${rkey}`;
};
