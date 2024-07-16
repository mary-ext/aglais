import { For, Match, Show, Switch } from 'solid-js';

import type { ComAtprotoServerListAppPasswords } from '@mary/bluesky-client/lexicons';
import { XRPCError } from '@mary/bluesky-client/xrpc';
import { createMutation, createQuery } from '@mary/solid-query';

import { openModal } from '~/globals/modals';

import { formatAbsDateTime } from '~/lib/intl/time';
import { reconcile } from '~/lib/misc';
import { useAgent } from '~/lib/states/agent';
import { useSession } from '~/lib/states/session';

import CircularProgressView from '~/components/circular-progress-view';
import ErrorView from '~/components/error-view';
import IconButton from '~/components/icon-button';
import AddOutlinedIcon from '~/components/icons-central/add-outline';
import TrashOutlinedIcon from '~/components/icons-central/trash-outline';
import * as Page from '~/components/page';
import * as Prompt from '~/components/prompt';

import AddAppPasswordPrompt from '~/components/settings/app-passwords/add-app-password-prompt';

const AppPasswordsSettingsPage = () => {
	const { currentAccount } = useSession();
	const { rpc } = useAgent();

	const isLimited = !currentAccount || currentAccount.data.scope !== undefined;

	const passwords = createQuery(() => {
		return {
			queryKey: ['app-passwords'],
			async queryFn() {
				// We know this is going to throw so throw early
				if (isLimited) {
					throw new XRPCError(400, { kind: 'InvalidToken', message: 'Bad token scope' });
				}

				const { data } = await rpc.get('com.atproto.server.listAppPasswords', {});

				return data.passwords;
			},
			structuralSharing(oldData, newData): any {
				// @ts-expect-error
				return reconcile(oldData, newData, 'createdAt');
			},
		};
	});

	return (
		<>
			<Page.Header>
				<Page.HeaderAccessory>
					<Page.Back to="/" />
				</Page.HeaderAccessory>

				<Page.Heading title="App passwords" />

				<Page.HeaderAccessory>
					<IconButton
						icon={AddOutlinedIcon}
						title="Create new app password"
						disabled={isLimited}
						onClick={() => {
							openModal(() => <AddAppPasswordPrompt />);
						}}
					/>
				</Page.HeaderAccessory>
			</Page.Header>

			<div class="flex flex-col gap-2 py-4">
				<p class="text-pretty px-4 text-de text-contrast-muted">
					Use app passwords to sign in to Bluesky clients and other services without giving full access to
					your account or password.
				</p>

				<Switch>
					<Match when={passwords.data}>
						{(entries) => (
							<Show
								when={entries().length > 0}
								fallback={<p class="py-6 text-center text-base font-medium">No app passwords set up yet.</p>}
							>
								<div class="flex flex-col divide-y divide-outline/50 overflow-hidden rounded-lg bg-contrast/5">
									<For each={entries()}>{(item) => <PasswordEntry item={item} />}</For>
								</div>
							</Show>
						)}
					</Match>

					<Match when={passwords.error}>
						{(err) => <ErrorView error={err()} onRetry={() => passwords.refetch()} />}
					</Match>

					<Match when>
						<CircularProgressView />
					</Match>
				</Switch>
			</div>
		</>
	);
};

export default AppPasswordsSettingsPage;

interface PasswordEntryProps {
	item: ComAtprotoServerListAppPasswords.AppPassword;
}

const PasswordEntry = ({ item }: PasswordEntryProps) => {
	const { rpc } = useAgent();

	const mutation = createMutation((queryClient) => {
		return {
			async mutationFn() {
				await rpc.call('com.atproto.server.revokeAppPassword', {
					data: { name: item.name },
				});
			},
			async onSuccess() {
				await queryClient.invalidateQueries({ queryKey: ['app-passwords'] });
			},
		};
	});

	return (
		<div class="flex justify-between gap-4 px-4 py-3 text-left">
			<div class="flex min-w-0 flex-col">
				<p class={`break-words text-sm font-medium` + (mutation.isPending ? ` text-contrast-muted` : ``)}>
					{/* @once */ item.name}
				</p>
				<p class="min-w-0 break-words text-de text-contrast-muted">
					{/* @once */ `Created at ${formatAbsDateTime(item.createdAt)}`}
				</p>
			</div>

			<IconButton
				icon={TrashOutlinedIcon}
				title="Remove this app password"
				disabled={mutation.isPending}
				onClick={() => {
					openModal(() => (
						<Prompt.Confirm
							title="Delete this app password?"
							description="Any clients or services using this password will be signed out"
							danger
							confirmLabel="Delete"
							onConfirm={() => mutation.mutate()}
						/>
					));
				}}
				variant="danger"
				class="-mr-2 mt-0.5"
			/>
		</div>
	);
};
