import { batch, createRenderEffect, createSignal, onCleanup, type Accessor } from 'solid-js';

import type { AppBskyActorDefs, At } from '@mary/bluesky-client/lexicons';
import { EventEmitter } from '@mary/events';
import type { QueryClient } from '@mary/solid-query';

import { findAllProfiles as findAllProfilesInBookmarkFeedQueryData } from '../queries-cache/bookmark-feed';
import { findAllProfiles as findAllProfilesInPostThreadQueryData } from '../queries-cache/post-thread';
import { findAllProfiles as findAllProfilesInProfileQueryData } from '../queries-cache/profile';
import { findAllProfiles as findAllProfilesInProfileFollowersQueryData } from '../queries-cache/profile-followers';
import { findAllProfiles as findAllProfilesInProfileFollowingQueryData } from '../queries-cache/profile-following';
import { findAllProfiles as findAllProfilesInTimelineQueryData } from '../queries-cache/timeline';
import { EQUALS_DEQUAL } from '../utils/dequal';
import type { AccessorMaybe } from '../utils/types';
import { iterateQueryCache } from './utils';

export interface ProfileShadow {
	blockUri?: string;
	followUri?: string;
	muted?: boolean;
}

export interface ProfileShadowView {
	blockUri: string | undefined;
	followUri: string | undefined;
	muted: boolean;
}

type AllProfileView =
	| AppBskyActorDefs.ProfileView
	| AppBskyActorDefs.ProfileViewBasic
	| AppBskyActorDefs.ProfileViewDetailed;

const emitter = new EventEmitter<{ [uri: At.DID]: () => void }>();
const shadows = new WeakMap<AllProfileView, ProfileShadow>();

export const useProfileShadow = (profile: AccessorMaybe<AllProfileView>): Accessor<ProfileShadowView> => {
	if (typeof profile === 'function') {
		const [view, setView] = createSignal<ProfileShadowView>(undefined as any, EQUALS_DEQUAL);

		createRenderEffect(() => {
			const $profile = profile();

			setView(getProfileShadow($profile));
			onCleanup(emitter.on($profile.did, () => setView(getProfileShadow($profile))));
		});

		return view;
	} else {
		const [view, setView] = createSignal(getProfileShadow(profile), EQUALS_DEQUAL);

		onCleanup(emitter.on(profile.did, () => setView(getProfileShadow(profile))));
		return view;
	}
};

export const getProfileShadow = (profile: AllProfileView): ProfileShadowView => {
	const shadow = shadows.get(profile) ?? {};

	return {
		blockUri: 'blockUri' in shadow ? shadow.blockUri : profile.viewer?.blocking,
		followUri: 'followUri' in shadow ? shadow.followUri : profile.viewer?.following,
		muted: ('muted' in shadow ? shadow.muted : profile.viewer?.muted) ?? false,
	};
};

export const updateProfileShadow = (queryClient: QueryClient, did: At.DID, value: Partial<ProfileShadow>) => {
	for (const profile of findProfilesInCache(queryClient, did)) {
		shadows.set(profile, { ...shadows.get(profile), ...value });
	}

	batch(() => emitter.emit(did));
};

export function findProfilesInCache(queryClient: QueryClient, did: At.DID): Generator<AllProfileView> {
	return iterateQueryCache<AllProfileView>(queryClient, [
		findAllProfilesInProfileQueryData(did),
		findAllProfilesInTimelineQueryData(did),
		findAllProfilesInPostThreadQueryData(did),
		findAllProfilesInBookmarkFeedQueryData(did),
		findAllProfilesInProfileFollowingQueryData(did),
		findAllProfilesInProfileFollowersQueryData(did),
	]);
}
