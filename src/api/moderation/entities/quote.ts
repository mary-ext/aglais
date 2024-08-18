import type { AppBskyEmbedRecord, AppBskyFeedPost } from '@atcute/client/lexicons';

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

export const moderateQuote = (quote: AppBskyEmbedRecord.ViewRecord, opts: ModerationOptions) => {
	const author = quote.author;
	const record = quote.value as AppBskyFeedPost.Record;
	const text = record.text + unwrapPostEmbedText(record.embed);

	const accu: ModerationCause[] = moderateProfile(author, opts);

	decideLabelModeration(accu, TargetContent, quote.labels, author.did, opts);
	decideMutedKeywordModeration(accu, text, !!author.viewer?.following, PreferenceWarn, opts);

	return accu;
};
