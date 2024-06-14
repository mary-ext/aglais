import type { AppBskyActorDefs } from '@mary/bluesky-client/lexicons';

import { type ProfileShadowView } from '~/api/cache/profile-shadow';

import {
	TargetAccount,
	TargetProfile,
	decideLabelModeration,
	decideMutedPermanentModeration,
	decideMutedTemporaryModeration,
	type ModerationCause,
	type ModerationOptions,
} from '..';

type AllProfileView =
	| AppBskyActorDefs.ProfileView
	| AppBskyActorDefs.ProfileViewBasic
	| AppBskyActorDefs.ProfileViewDetailed;

export const moderateProfile = (
	profile: AllProfileView,
	shadow: ProfileShadowView,
	opts: ModerationOptions,
) => {
	const accu: ModerationCause[] = [];
	const did = profile.did;

	const labels = profile.labels;
	const profileLabels = labels?.filter((label) => label.uri.endsWith('/app.bsky.actor.profile/self'));
	const accountLabels = labels?.filter((label) => !label.uri.endsWith('/app.bsky.actor.profile/self'));

	decideLabelModeration(accu, TargetProfile, profileLabels, did, opts);
	decideLabelModeration(accu, TargetAccount, accountLabels, did, opts);
	decideMutedPermanentModeration(accu, shadow.muted);
	decideMutedTemporaryModeration(accu, did, opts);

	return accu;
};
