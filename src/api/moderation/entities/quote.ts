import type { AppBskyEmbedRecord, AppBskyFeedPost } from '@mary/bluesky-client/lexicons';

import type { ProfileShadowView } from '~/api/cache/profile-shadow';
import { unwrapPostEmbedText } from '~/api/utils/post';

import {
	PreferenceWarn,
	TargetContent,
	decideLabelModeration,
	decideMutedKeywordModeration,
	type ModerationCause,
	type ModerationOptions,
} from '..';
import { moderateProfile } from './profile';

export const moderateQuote = (
	quote: AppBskyEmbedRecord.ViewRecord,
	authorShadow: ProfileShadowView,
	opts: ModerationOptions,
) => {
	const author = quote.author;
	const record = quote.value as AppBskyFeedPost.Record;
	const text = record.text + unwrapPostEmbedText(record.embed);

	const accu: ModerationCause[] = moderateProfile(author, authorShadow, opts);

	decideLabelModeration(accu, TargetContent, quote.labels, author.did, opts);
	decideMutedKeywordModeration(accu, text, !!authorShadow.followUri, PreferenceWarn, opts);

	return accu;
};
