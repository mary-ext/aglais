import { Match, onMount, Switch } from 'solid-js';

import type { AppBskyActorDefs, At } from '@atcute/client/lexicons';
import { createMutation } from '@mary/solid-query';

import { updateProfileShadow, useProfileShadow } from '~/api/cache/profile-shadow';
import { createListMetaQuery } from '~/api/queries/list';
import { createRecord, deleteRecord } from '~/api/utils/mutation';
import { parseAtUri } from '~/api/utils/strings';
import { getCurrentDate } from '~/api/utils/utils';

import { useModalContext } from '~/globals/modals';

import { useAgent } from '~/lib/states/agent';
import { useSession } from '~/lib/states/session';

import CircularProgress from '../circular-progress';
import CircularProgressView from '../circular-progress-view';
import ListEmbed from '../embeds/list-embed';
import EyeOpenOutlinedIcon from '../icons-central/eye-open-outline';
import MegaphoneOutlinedIcon from '../icons-central/megaphone-outline';
import ReplyOutlinedIcon from '../icons-central/reply-outline';
import * as Prompt from '../prompt';

export interface BlockAccountPrompt {
	/** Expected to be static */
	profile: AppBskyActorDefs.ProfileViewDetailed;
}

const BlockAccountPrompt = (props: BlockAccountPrompt) => {
	const profile = props.profile;
	const shadow = useProfileShadow(props.profile);

	return (
		<Switch>
			<Match when={/* @once */ profile.viewer?.blockingByList}>
				<BlockedByList {...props} />
			</Match>

			<Match when={shadow().blockUri}>
				<UnblockPrompt {...props} />
			</Match>

			<Match when>
				<BlockPrompt {...props} />
			</Match>
		</Switch>
	);
};

export default BlockAccountPrompt;

const BlockPrompt = ({ profile }: BlockAccountPrompt) => {
	const { close } = useModalContext();

	const { currentAccount } = useSession();
	const { rpc } = useAgent();

	const mutation = createMutation((queryClient) => ({
		async mutationFn() {
			return await createRecord(rpc, {
				repo: currentAccount!.did,
				collection: 'app.bsky.graph.block',
				record: {
					createdAt: getCurrentDate(),
					subject: profile.did,
				},
			});
		},
		onSuccess(ret) {
			close();
			updateProfileShadow(queryClient, profile.did, { blockUri: ret.uri });
		},
		onError() {
			close();
		},
	}));

	return (
		<Prompt.Container maxWidth="md" disabled={mutation.isPending}>
			<Prompt.Title>{/* @once */ `Block @${profile.handle}?`}</Prompt.Title>

			<Prompt.Description>Here's what happens if you do:</Prompt.Description>

			<div class="mt-3 flex flex-col gap-3 text-sm">
				<div class="flex items-start gap-3">
					<div class="grid h-8 w-8 shrink-0 place-items-center">
						<MegaphoneOutlinedIcon class="text-xl text-contrast-muted" />
					</div>

					<p class="mt-1.5">They can see they're blocked</p>
				</div>

				<div class="flex items-start gap-3">
					<div class="grid h-8 w-8 shrink-0 place-items-center">
						<EyeOpenOutlinedIcon class="text-xl text-contrast-muted" />
					</div>

					<p class="mt-1.5">They can't see your posts, and you won't see theirs and any replies to them</p>
				</div>

				<div class="flex items-start gap-3">
					<div class="grid h-8 w-8 shrink-0 place-items-center">
						<ReplyOutlinedIcon class="text-xl text-contrast-muted" />
					</div>

					<p class="mt-1.5">They can't mention you or reply to your posts</p>
				</div>
			</div>

			<Prompt.Actions>
				<Prompt.Action onClick={() => mutation.mutate()} noClose variant="danger">
					Block
				</Prompt.Action>
				<Prompt.Action>Cancel</Prompt.Action>
			</Prompt.Actions>
		</Prompt.Container>
	);
};

const UnblockPrompt = ({ profile }: BlockAccountPrompt) => {
	const { close } = useModalContext();

	const { rpc } = useAgent();
	const { repo, rkey } = parseAtUri(profile.viewer!.blocking!);

	const mutation = createMutation((queryClient) => ({
		async mutationFn() {
			return await deleteRecord(rpc, {
				repo: repo as At.DID,
				collection: 'app.bsky.graph.block',
				rkey: rkey,
			});
		},
		onSuccess() {
			close();
			updateProfileShadow(queryClient, profile.did, { blockUri: undefined });
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

const BlockedByList = ({ profile }: BlockAccountPrompt) => {
	const { close } = useModalContext();

	const listBasic = profile.viewer!.blockingByList!;
	const query = createListMetaQuery(() => listBasic.uri);

	return (
		<Prompt.Container>
			<Prompt.Title>{/* @once */ `Can't unblock @${profile.handle}`}</Prompt.Title>
			<Prompt.Description>
				You've currently opted to block all accounts that are in this moderation list:
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
