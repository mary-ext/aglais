import {
	type ActorIdentifier,
	type Nsid,
	type ParsedCanonicalResourceUri,
	type RecordKey,
	type ResourceUri,
	parseCanonicalResourceUri,
} from '@atcute/lexicons';
import type { Records } from '@atcute/lexicons/ambient';

import { assert } from '~/lib/utils/invariant';

// #__NO_SIDE_EFFECTS__
export const assertCanonicalResourceUri = (input: string): ParsedCanonicalResourceUri => {
	const result = parseCanonicalResourceUri(input);
	if (!result.ok) {
		assert(false, result.error);
	}

	return result.value;
};

export const makeAtUri = (
	repo: ActorIdentifier,
	collection: keyof Records | (Nsid & {}),
	rkey: RecordKey,
): ResourceUri => {
	return `at://${repo}/${collection}/${rkey}`;
};
