import { batch, createSignal, onCleanup } from 'solid-js';

import type { AppBskyActorDefs, At } from '@mary/bluesky-client/lexicons';
import { EventEmitter } from '@mary/events';
import type { QueryClient } from '@mary/solid-query';

import { findAllProfilesInQueryData as findAllProfilesInProfileQueryData } from '../queries/profile';
import { findAllProfilesInQueryData as findAllProfilesInTimelineQueryData } from '../queries/timeline';
import { EQUALS_DEQUAL } from '../utils/dequal';

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

export const useProfileShadow = (profile: AllProfileView) => {
	const [view, setView] = createSignal(getProfileShadow(profile), EQUALS_DEQUAL);

	onCleanup(emitter.on(profile.did, () => setView(getProfileShadow(profile))));
	return view;
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

export function* findProfilesInCache(queryClient: QueryClient, did: At.DID): Generator<AllProfileView> {
	yield* findAllProfilesInProfileQueryData(queryClient, did);
	yield* findAllProfilesInTimelineQueryData(queryClient, did);
}
