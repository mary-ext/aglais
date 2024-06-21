import { For, Match, Switch, createMemo } from 'solid-js';

import { useProfileQuery } from '~/api/queries/profile';

import { openModal, useModalContext } from '~/globals/modals';

import { formatCompact } from '~/lib/intl/number';
import { useSession } from '~/lib/states/session';

import Avatar from '../avatar';
import IconButton from '../icon-button';
import AddOutlinedIcon from '../icons-central/add-outline';
import BulletListOutlinedIcon from '../icons-central/bullet-list-outline';
import GearOutlinedIcon from '../icons-central/gear-outline';
import LeaveOutlinedIcon from '../icons-central/leave-outline';
import MoreHorizOutlinedIcon from '../icons-central/more-horiz-outline';
import PersonOutlinedIcon from '../icons-central/person-outline';
import ShieldOutlinedIcon from '../icons-central/shield-outline';
import * as Sidebar from '../sidebar';

import ManageAccountDialogLazy from './manage-account-dialog-lazy';

const MainSidebarAuthenticated = () => {
	const { close } = useModalContext();
	const { currentAccount } = useSession();

	return (
		<>
			<Sidebar.Backdrop />
			<Sidebar.Container>
				<AuthenticatedHeader />

				<Sidebar.NavItem icon={PersonOutlinedIcon} label="Profile" href={`/${currentAccount!.did}`} />
				<Sidebar.NavItem icon={BulletListOutlinedIcon} label="Lists" href="/lists" />
				<Sidebar.NavItem icon={ShieldOutlinedIcon} label="Moderation" href="/moderation" />
				<Sidebar.NavItem icon={GearOutlinedIcon} label="Settings" href="/settings" />

				<Sidebar.Item
					icon={LeaveOutlinedIcon}
					label="Sign out"
					onClick={() => {
						close();
					}}
				/>
			</Sidebar.Container>
		</>
	);
};

export default MainSidebarAuthenticated;

const AuthenticatedHeader = () => {
	const { close } = useModalContext();

	const { currentAccount, getAccounts, resumeSession } = useSession();
	const query = useProfileQuery(() => currentAccount!.did);

	const otherAccounts = createMemo(() => {
		return getAccounts()
			.filter((acc) => acc.did !== currentAccount!.did)
			.slice(0, 2);
	});

	return (
		<Switch>
			<Match when={query.data}>
				{(profile) => {
					return (
						<div class="flex flex-col p-4">
							<div class="flex justify-between">
								<Avatar type="user" src={profile().avatar} size="lg" />

								{otherAccounts().length === 0 ? (
									<IconButton
										icon={AddOutlinedIcon}
										title="Manage accounts"
										size="sm"
										onClick={() => {
											close();
											openModal(() => <ManageAccountDialogLazy />);
										}}
									/>
								) : (
									<div class="flex gap-2">
										<For each={otherAccounts()}>
											{(account) => {
												const profile = useProfileQuery(() => account.did);
												const handleClick = () => {
													resumeSession(account);
													close();
												};

												return (
													<IconButton
														icon={() => {
															return <Avatar type="user" src={profile.data?.avatar} size="sm" />;
														}}
														title={`@${profile.data?.handle ?? account.session.handle}`}
														size="sm"
														onClick={handleClick}
													/>
												);
											}}
										</For>

										<IconButton
											icon={MoreHorizOutlinedIcon}
											title="Manage accounts"
											size="sm"
											onClick={() => {
												close();
												openModal(() => <ManageAccountDialogLazy />);
											}}
										/>
									</div>
								)}
							</div>

							<div class="mt-2 flex flex-col">
								<p class="overflow-hidden break-words text-lg font-bold empty:hidden">
									{profile().displayName}
								</p>
								<p class="overflow-hidden break-words text-sm text-c-contrast-600">
									{'@' + profile().handle}
								</p>
							</div>

							<div class="mt-3 flex min-w-0 flex-wrap gap-5 text-sm">
								<a onClick={close}>
									<span class="font-bold">{formatCompact(profile().followsCount ?? 0)}</span>
									<span class="text-c-contrast-600"> Following</span>
								</a>

								<a onClick={close}>
									<span class="font-bold">{formatCompact(profile().followersCount ?? 0)}</span>
									<span class="text-c-contrast-600"> Followers</span>
								</a>
							</div>
						</div>
					);
				}}
			</Match>
		</Switch>
	);
};
