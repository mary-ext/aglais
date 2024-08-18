import type { At, ComAtprotoLabelDefs } from '@atcute/client/lexicons';

import { TargetContent, decideLabelModeration, type ModerationCause, type ModerationOptions } from '..';

export const moderateGeneric = (
	item: { labels?: ComAtprotoLabelDefs.Label[] },
	userDid: At.DID,
	opts: ModerationOptions,
) => {
	const accu: ModerationCause[] = [];

	decideLabelModeration(accu, TargetContent, item.labels, userDid, opts);

	return accu;
};
