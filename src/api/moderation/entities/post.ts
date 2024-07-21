import type { AppBskyFeedDefs, AppBskyFeedPost } from '@mary/bluesky-client/lexicons';

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

export const moderatePost = (post: AppBskyFeedDefs.PostView, opts: ModerationOptions) => {
	const author = post.author;
	const record = post.record as AppBskyFeedPost.Record;
	const text = record.text + unwrapPostEmbedText(record.embed);

	const accu: ModerationCause[] = moderateProfile(author, opts);

	decideLabelModeration(accu, TargetContent, post.labels, author.did, opts);
	decideMutedKeywordModeration(accu, text, !!author.viewer?.following, PreferenceWarn, opts);

	return accu;
};
