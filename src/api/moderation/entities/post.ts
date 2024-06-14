import type { AppBskyFeedDefs, AppBskyFeedPost } from '@mary/bluesky-client/lexicons';

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

export const moderatePost = (
	post: AppBskyFeedDefs.PostView,
	authorShadow: ProfileShadowView,
	opts: ModerationOptions,
) => {
	const author = post.author;
	const record = post.record as AppBskyFeedPost.Record;
	const text = record.text + unwrapPostEmbedText(record.embed);

	const accu: ModerationCause[] = moderateProfile(author, authorShadow, opts);

	decideLabelModeration(accu, TargetContent, post.labels, author.did, opts);
	decideMutedKeywordModeration(accu, text, !!authorShadow.followUri, PreferenceWarn, opts);

	return accu;
};
