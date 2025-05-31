import type { ComAtprotoLabelDefs } from '@atcute/atproto';
import type { Did } from '@atcute/lexicons';

import { type ModerationCause, type ModerationOptions, decideLabelModeration } from '..';
import { TargetContent } from '../constants';

export const moderateGeneric = (
	item: { labels?: ComAtprotoLabelDefs.Label[] },
	userDid: Did,
	opts: ModerationOptions,
) => {
	const accu: ModerationCause[] = [];

	decideLabelModeration(accu, TargetContent, item.labels, userDid, opts);

	return accu;
};
