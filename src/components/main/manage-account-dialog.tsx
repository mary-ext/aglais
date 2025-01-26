import { For } from 'solid-js';

import { createProfileQuery } from '~/api/queries/profile';

import { closeAllModals, openModal } from '~/globals/modals';

import type { AccountData } from '~/lib/preferences/sessions';
import { useSession } from '~/lib/states/session';

import Avatar, { getUserAvatarType } from '~/components/avatar';
import * as Dialog from '~/components/dialog';
import Divider from '~/components/divider';
import IconButton from '~/components/icon-button';
import CircleCheckSolidIcon from '~/components/icons-central/circle-check-solid';
import MoreHorizOutlinedIcon from '~/components/icons-central/more-horiz-outline';

import AccountOverflowMenu from './account-overflow-menu';
import SignInDialogLazy from './sign-in-dialog-lazy';

const ManageAccountDialog = () => {
	const { currentAccount, getAccounts, resumeSession } = useSession();

	const switchAccount = async (account: AccountData) => {
		resumeSession(account.did);
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

					<Divider gutterTop="md" gutterBottom="sm" />

					<div class="flex flex-col">
						<button
							onClick={() => {
								openModal(() => <SignInDialogLazy />);
							}}
							class="px-4 py-3 text-left text-sm text-accent hover:bg-accent/md active:bg-accent/md-pressed"
						>
							Add new account
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
	const profile = createProfileQuery(() => currentAccount!.did);

	return (
		<div class="flex gap-4 px-4 py-3">
			<Avatar type={getUserAvatarType(profile.data)} src={profile.data?.avatar} class="mt-0.5" />

			<div class="min-w-0 grow self-center text-sm">
				<p class="overflow-hidden text-ellipsis whitespace-nowrap font-bold empty:hidden">
					{profile.data?.displayName}
				</p>
				<p class="overflow-hidden text-ellipsis whitespace-nowrap text-de text-contrast-muted">
					{'@' + profile.data?.handle.toLowerCase()}
				</p>
			</div>

			<div class="mt-2.5 shrink-0 text-lg text-repost">
				<CircleCheckSolidIcon />
			</div>
		</div>
	);
};

const AccountItem = ({ account, onClick }: { account: AccountData; onClick?: () => void }) => {
	const profile = () => account.profile;

	return (
		<div class="relative flex flex-col">
			<button
				onClick={onClick}
				class="flex gap-4 px-4 py-3 pr-11 text-left hover:bg-contrast/md active:bg-contrast/sm-pressed"
			>
				<Avatar type={getUserAvatarType(profile())} src={profile().avatar} class="mt-0.5" />

				<div class="min-w-0 grow self-center text-sm">
					<p class="overflow-hidden text-ellipsis whitespace-nowrap font-bold empty:hidden">
						{profile().displayName}
					</p>
					<p class="overflow-hidden text-ellipsis whitespace-nowrap text-de text-contrast-muted">
						{(() => {
							const handle = profile().handle;
							return handle !== 'handle.invalid' ? '@' + handle : account.did;
						})()}
					</p>
				</div>
			</button>

			<IconButton
				icon={MoreHorizOutlinedIcon}
				title="Actions"
				class="absolute right-2 top-1/2 -translate-y-1/2"
				onClick={(ev) => {
					const anchor = ev.currentTarget;

					openModal(() => <AccountOverflowMenu anchor={anchor} account={account} />);
				}}
			/>
		</div>
	);
};
