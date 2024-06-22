import { For } from 'solid-js';

import { useProfileQuery } from '~/api/queries/profile';

import { closeAllModals, openModal } from '~/globals/modals';

import type { AccountData } from '~/lib/preferences/sessions';
import { useSession } from '~/lib/states/session';

import Avatar from '../avatar';
import * as Dialog from '../dialog';
import Divider from '../divider';
import CircleCheckSolidIcon from '../icons-central/circle-check-solid';

import SignInDialogLazy from './sign-in-dialog-lazy';

const ManageAccountDialog = () => {
	const { currentAccount, getAccounts, resumeSession } = useSession();

	const switchAccount = async (account: AccountData) => {
		resumeSession(account);
		closeAllModals();
	};

	return (
		<>
			<Dialog.Backdrop />
			<Dialog.Container maxWidth="sm" fullHeight>
				<Dialog.Header>
					<Dialog.HeaderAccessory>
						<Dialog.Close />
					</Dialog.HeaderAccessory>

					<Dialog.Heading title="Manage accounts" />
				</Dialog.Header>
				<Dialog.Body unpadded>
					<div class="flex flex-col">
						<CurrentAccountItem />
						<For each={getAccounts().filter((account) => account.did !== currentAccount!.did)}>
							{(account) => <AccountItem account={account} onClick={() => switchAccount(account)} />}
						</For>
					</div>

					<Divider gutterTop="md" />

					<div class="flex flex-col">
						<button
							onClick={() => {
								openModal(() => <SignInDialogLazy />);
							}}
							class="px-4 py-3 text-left text-sm text-accent hover:bg-accent/md active:bg-accent/lg"
						>
							Add new account
						</button>

						<button class="px-4 py-3 text-left text-sm text-error hover:bg-error/md active:bg-error/lg">
							Sign out of all accounts
						</button>
					</div>
				</Dialog.Body>
			</Dialog.Container>
		</>
	);
};

export default ManageAccountDialog;

const CurrentAccountItem = () => {
	const { currentAccount } = useSession();
	const profile = useProfileQuery(() => currentAccount!.did);

	return (
		<div class="flex gap-4 px-4 py-3">
			<Avatar type="user" src={profile.data?.avatar} class="mt-0.5" />

			<div class="min-w-0 grow self-center text-sm">
				<p class="overflow-hidden text-ellipsis whitespace-nowrap font-bold empty:hidden">
					{profile.data?.displayName}
				</p>
				<p class="overflow-hidden text-ellipsis whitespace-nowrap text-de text-contrast-muted">
					{'@' + (profile.data?.handle ?? currentAccount!.data.session.handle)}
				</p>
			</div>

			<div class="mt-2.5 shrink-0 text-lg text-repost">
				<CircleCheckSolidIcon />
			</div>
		</div>
	);
};

const AccountItem = ({ account, onClick }: { account: AccountData; onClick?: () => void }) => {
	const profile = useProfileQuery(() => account.did);

	return (
		<button
			onClick={onClick}
			class="flex gap-4 px-4 py-3 text-left hover:bg-contrast/md active:bg-contrast/lg"
		>
			<Avatar type="user" src={profile.data?.avatar} class="mt-0.5" />

			<div class="min-w-0 grow self-center text-sm">
				<p class="overflow-hidden text-ellipsis whitespace-nowrap font-bold empty:hidden">
					{profile.data?.displayName}
				</p>
				<p class="overflow-hidden text-ellipsis whitespace-nowrap text-de text-contrast-muted">
					{'@' + (profile.data?.handle ?? account.session.handle)}
				</p>
			</div>
		</button>
	);
};
