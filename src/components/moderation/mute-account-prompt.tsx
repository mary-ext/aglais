import { Match, onMount, Switch } from 'solid-js';

import type { AppBskyActorDefs } from '@mary/bluesky-client/lexicons';
import { createMutation } from '@mary/solid-query';

import { updateProfileShadow, useProfileShadow } from '~/api/cache/profile-shadow';

import { useModalContext } from '~/globals/modals';

import { useAgent } from '~/lib/states/agent';

import CircularProgressView from '../circular-progress-view';
import EyeOpenOutlinedIcon from '../icons-central/eye-open-outline';
import MegaphoneOutlinedIcon from '../icons-central/megaphone-outline';
import ReplyOutlinedIcon from '../icons-central/reply-outline';
import * as Prompt from '../prompt';

export interface MuteAccountPromptProps {
	/** Expected to be static */
	profile: AppBskyActorDefs.ProfileViewDetailed;
}

const MuteAccountPrompt = ({ profile }: MuteAccountPromptProps) => {
	const shadow = useProfileShadow(profile);

	return (
		<Switch>
			<Match when={shadow().muted}>
				<UnmutePrompt profile={profile} />
			</Match>

			<Match when>
				<MutePrompt profile={profile} />
			</Match>
		</Switch>
	);
};

export default MuteAccountPrompt;

const MutePrompt = ({ profile }: MuteAccountPromptProps) => {
	const { close } = useModalContext();

	const { rpc } = useAgent();

	const mutation = createMutation((queryClient) => ({
		async mutationFn() {
			await rpc.call('app.bsky.graph.muteActor', {
				data: {
					actor: profile.did,
				},
			});
		},
		onSuccess() {
			close();
			updateProfileShadow(queryClient, profile.did, { muted: true });
		},
		onError() {
			close();
		},
	}));

	return (
		<Prompt.Container disabled={mutation.isPending}>
			<Prompt.Title>{/* @once */ `Mute @${profile.handle}?`}</Prompt.Title>

			<Prompt.Description>Here's what happens if you do:</Prompt.Description>

			<div class="mt-3 flex flex-col gap-3 text-sm">
				<div class="flex items-start gap-3">
					<div class="grid h-8 w-8 shrink-0 place-items-center">
						<MegaphoneOutlinedIcon class="text-xl text-contrast-muted" />
					</div>

					<p class="mt-1.5">They won't know they've been muted</p>
				</div>

				<div class="flex items-start gap-3">
					<div class="grid h-8 w-8 shrink-0 place-items-center">
						<EyeOpenOutlinedIcon class="text-xl text-contrast-muted" />
					</div>

					<p class="mt-1.5">They can see your posts, but you won't see theirs and any replies to them</p>
				</div>

				<div class="flex items-start gap-3">
					<div class="grid h-8 w-8 shrink-0 place-items-center">
						<ReplyOutlinedIcon class="text-xl text-contrast-muted" />
					</div>

					<p class="mt-1.5">
						They can mention you and reply to your posts, but you won't see any notifications from them
					</p>
				</div>
			</div>

			<Prompt.Actions>
				<Prompt.Action onClick={() => mutation.mutate()} noClose variant="primary">
					Mute
				</Prompt.Action>
				<Prompt.Action>Cancel</Prompt.Action>
			</Prompt.Actions>
		</Prompt.Container>
	);
};

const UnmutePrompt = ({ profile }: MuteAccountPromptProps) => {
	const { close } = useModalContext();

	const { rpc } = useAgent();

	const mutation = createMutation((queryClient) => ({
		async mutationFn() {
			await rpc.call('app.bsky.graph.unmuteActor', {
				data: {
					actor: profile.did,
				},
			});
		},
		onSuccess() {
			close();
			updateProfileShadow(queryClient, profile.did, { muted: false });
		},
		onError() {
			close();
		},
	}));

	onMount(() => {
		mutation.mutate();
	});

	return (
		<Prompt.Container disabled={mutation.isPending}>
			<CircularProgressView />
		</Prompt.Container>
	);
};
