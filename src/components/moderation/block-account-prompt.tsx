import { Match, Switch } from 'solid-js';

import type { AppBskyActorDefs } from '@atcute/bluesky';
import { type Did } from '@atcute/lexicons';
import { QueryClient, createMutation } from '@mary/solid-query';

import { type ProfileShadowView, updateProfileShadow, useProfileShadow } from '~/api/cache/profile-shadow';
import { createListMetaQuery } from '~/api/queries/list';
import { assertCanonicalResourceUri } from '~/api/types/at-uri';
import { getCurrentDate } from '~/api/utils/misc';
import { createRecord, deleteRecord } from '~/api/utils/records';

import { useModalContext } from '~/globals/modals';

import { useAgent } from '~/lib/states/agent';
import { useSession } from '~/lib/states/session';

import CircularProgress from '../circular-progress';
import ListEmbed from '../embeds/list-embed';
import EyeOpenOutlinedIcon from '../icons-central/eye-open-outline';
import MegaphoneOutlinedIcon from '../icons-central/megaphone-outline';
import ReplyOutlinedIcon from '../icons-central/reply-outline';
import * as Prompt from '../prompt';

export interface BlockAccountPrompt {
	profile: AppBskyActorDefs.ProfileViewDetailed;
}

const BlockAccountPrompt = (props: BlockAccountPrompt) => {
	const profile = () => props.profile;
	const shadow = useProfileShadow(profile);

	return (
		<Switch>
			<Match when={profile().viewer?.blockingByList}>
				<BlockedByList profile={profile()} shadow={shadow()} />
			</Match>

			<Match when={shadow().blockUri}>
				<UnblockPrompt profile={profile()} shadow={shadow()} />
			</Match>

			<Match when>
				<BlockPrompt profile={profile()} shadow={shadow()} />
			</Match>
		</Switch>
	);
};

export default BlockAccountPrompt;

interface BlockAccountPromptInnerProps extends BlockAccountPrompt {
	shadow: ProfileShadowView;
}

const BlockPrompt = (props: BlockAccountPromptInnerProps) => {
	const { close } = useModalContext();

	const { currentAccount } = useSession();
	const { pds } = useAgent();

	const mutation = createMutation((queryClient) => ({
		async mutationFn() {
			return await createRecord(pds!, {
				repo: currentAccount!.did,
				collection: 'app.bsky.graph.block',
				record: {
					$type: 'app.bsky.graph.block',
					createdAt: getCurrentDate(),
					subject: props.profile.did,
				},
			});
		},
		onSuccess(ret) {
			close();
			updateProfileShadow(queryClient, props.profile.did, { blockUri: ret.uri });

			setTimeout(() => {
				resetThreadQueries(queryClient, props.profile.did);
			}, 1_500);
		},
		onError() {
			close();
		},
	}));

	return (
		<Prompt.Container maxWidth="md" disabled={mutation.isPending}>
			<Prompt.Title>{/* @once */ `Block @${props.profile.handle.toLowerCase()}?`}</Prompt.Title>

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

const UnblockPrompt = (props: BlockAccountPromptInnerProps) => {
	const { close } = useModalContext();

	const { pds } = useAgent();

	const mutation = createMutation((queryClient) => ({
		async mutationFn() {
			const uri = assertCanonicalResourceUri(props.shadow.blockUri!);

			return await deleteRecord(pds!, {
				repo: uri.repo,
				collection: 'app.bsky.graph.block',
				rkey: uri.rkey,
			});
		},
		onSuccess() {
			close();
			updateProfileShadow(queryClient, props.profile.did, { blockUri: undefined });

			setTimeout(() => {
				resetThreadQueries(queryClient, props.profile.did);
			}, 1_500);
		},
		onError() {
			close();
		},
	}));

	return (
		<Prompt.Container maxWidth="md" disabled={mutation.isPending}>
			<Prompt.Title>{/* @once */ `Unblock @${props.profile.handle.toLowerCase()}?`}</Prompt.Title>

			<Prompt.Description>Here's what happens if you do:</Prompt.Description>

			<div class="mt-3 flex flex-col gap-3 text-sm">
				<div class="flex items-start gap-3">
					<div class="grid h-8 w-8 shrink-0 place-items-center">
						<MegaphoneOutlinedIcon class="text-xl text-contrast-muted" />
					</div>

					<p class="mt-1.5">They can see they're unblocked</p>
				</div>

				<div class="flex items-start gap-3">
					<div class="grid h-8 w-8 shrink-0 place-items-center">
						<EyeOpenOutlinedIcon class="text-xl text-contrast-muted" />
					</div>

					<p class="mt-1.5">They can see your posts, and you'll see theirs and any replies to them</p>
				</div>

				<div class="flex items-start gap-3">
					<div class="grid h-8 w-8 shrink-0 place-items-center">
						<ReplyOutlinedIcon class="text-xl text-contrast-muted" />
					</div>

					<p class="mt-1.5">They can mention you or reply to your posts</p>
				</div>
			</div>

			<Prompt.Actions>
				<Prompt.Action onClick={() => mutation.mutate()} noClose variant="primary">
					Unblock
				</Prompt.Action>
				<Prompt.Action>Cancel</Prompt.Action>
			</Prompt.Actions>
		</Prompt.Container>
	);
};

const BlockedByList = (props: BlockAccountPromptInnerProps) => {
	const { close } = useModalContext();

	const query = createListMetaQuery(() => props.profile.viewer!.blockingByList!.uri);

	return (
		<Prompt.Container>
			<Prompt.Title>{/* @once */ `Can't unblock @${props.profile.handle.toLowerCase()}`}</Prompt.Title>
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

const resetThreadQueries = (queryClient: QueryClient, did: Did) => {
	const substring = `at://${did}/`;

	queryClient.resetQueries({
		queryKey: ['post-thread'],
		predicate(query) {
			const [, uri] = query.queryKey as ['post-thread', string];
			return uri.startsWith(substring);
		},
	});
};
