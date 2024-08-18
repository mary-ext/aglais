import { Match, onMount, Switch } from 'solid-js';

import type { AppBskyActorDefs } from '@atcute/client/lexicons';
import { createMutation } from '@mary/solid-query';

import { updateProfileShadow, useProfileShadow } from '~/api/cache/profile-shadow';
import { createListMetaQuery } from '~/api/queries/list';

import { useModalContext } from '~/globals/modals';

import { useAgent } from '~/lib/states/agent';

import CircularProgress from '../circular-progress';
import CircularProgressView from '../circular-progress-view';
import ListEmbed from '../embeds/list-embed';
import EyeOpenOutlinedIcon from '../icons-central/eye-open-outline';
import MegaphoneOutlinedIcon from '../icons-central/megaphone-outline';
import ReplyOutlinedIcon from '../icons-central/reply-outline';
import * as Prompt from '../prompt';

export interface MuteAccountPromptProps {
	/** Expected to be static */
	profile: AppBskyActorDefs.ProfileViewDetailed;
}

const MuteAccountPrompt = (props: MuteAccountPromptProps) => {
	const profile = props.profile;
	const shadow = useProfileShadow(props.profile);

	return (
		<Switch>
			<Match when={/* @once */ profile.viewer?.mutedByList}>
				<MutedByListPrompt {...props} />
			</Match>

			<Match when={shadow().muted}>
				<UnmutePrompt {...props} />
			</Match>

			<Match when>
				<MutePrompt {...props} />
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
		<Prompt.Container maxWidth="md" disabled={mutation.isPending}>
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

const MutedByListPrompt = ({ profile }: MuteAccountPromptProps) => {
	const { close } = useModalContext();

	const listBasic = profile.viewer!.mutedByList!;
	const query = createListMetaQuery(() => listBasic.uri);

	return (
		<Prompt.Container>
			<Prompt.Title>{/* @once */ `Can't unmute @${profile.handle}`}</Prompt.Title>
			<Prompt.Description>
				You've currently opted to mute all accounts that are in this moderation list:
			</Prompt.Description>

			<div class="mt-3">
				<Switch>
					<Match when={query.data} keyed>
						{(list) => <ListEmbed list={list} interactive onClick={close} />}
					</Match>

					<Match when>
						<div class="grid place-items-center" style="height:66px">
							<CircularProgress />
						</div>
					</Match>
				</Switch>
			</div>

			<Prompt.Actions>
				<Prompt.Action>Okay</Prompt.Action>
			</Prompt.Actions>
		</Prompt.Container>
	);
};
