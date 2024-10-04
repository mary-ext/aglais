import type { AppBskyActorDefs } from '@atcute/client/lexicons';

import {
	type ModerationCause,
	type ModerationOptions,
	decideLabelModeration,
	decideMutedPermanentModeration,
} from '..';
import { TargetAccount, TargetProfile } from '../constants';

type AllProfileView =
	| AppBskyActorDefs.ProfileView
	| AppBskyActorDefs.ProfileViewBasic
	| AppBskyActorDefs.ProfileViewDetailed;

export const moderateProfile = (profile: AllProfileView, opts: ModerationOptions) => {
	const accu: ModerationCause[] = [];
	const did = profile.did;

	const labels = profile.labels;
	const profileLabels = labels?.filter((label) => label.uri.endsWith('/app.bsky.actor.profile/self'));
	const accountLabels = labels?.filter((label) => !label.uri.endsWith('/app.bsky.actor.profile/self'));

	decideLabelModeration(accu, TargetProfile, profileLabels, did, opts);
	decideLabelModeration(accu, TargetAccount, accountLabels, did, opts);
	decideMutedPermanentModeration(accu, profile.viewer?.muted);

	return accu;
};
