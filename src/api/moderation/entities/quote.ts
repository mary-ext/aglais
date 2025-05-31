import type { AppBskyEmbedRecord, AppBskyFeedPost } from '@atcute/bluesky';

import { unwrapPostEmbedText } from '~/api/utils/post';

import {
	type ModerationCause,
	type ModerationOptions,
	decideLabelModeration,
	decideMutedKeywordModeration,
} from '..';
import { PreferenceWarn, TargetContent } from '../constants';

import { moderateProfile } from './profile';

export const moderateQuote = (quote: AppBskyEmbedRecord.ViewRecord, opts: ModerationOptions) => {
	const author = quote.author;
	const record = quote.value as AppBskyFeedPost.Main;
	const text = record.text + unwrapPostEmbedText(record.embed);

	const accu: ModerationCause[] = moderateProfile(author, opts);

	decideLabelModeration(accu, TargetContent, quote.labels, author.did, opts);
	decideMutedKeywordModeration(accu, text, !!author.viewer?.following, PreferenceWarn, opts);

	return accu;
};
