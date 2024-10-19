import { For, Match, Switch, createMemo } from 'solid-js';

import { createProfileQuery } from '~/api/queries/profile';

import { openModal, useModalContext } from '~/globals/modals';

import { formatCompact } from '~/lib/intl/number';
import { useSession } from '~/lib/states/session';

import { SWStatus, swStatus, updateSW } from '~/service-worker';

import Avatar, { getUserAvatarType } from '../avatar';
import IconButton from '../icon-button';
import AddOutlinedIcon from '../icons-central/add-outline';
import BookmarkOutlinedIcon from '../icons-central/bookmark-outline';
import BulletListOutlinedIcon from '../icons-central/bullet-list-outline';
import DownloadOutlinedIcon from '../icons-central/download-outline';
import GearOutlinedIcon from '../icons-central/gear-outline';
import HeartOutlinedIcon from '../icons-central/heart-outline';
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
				<Sidebar.NavItem icon={HeartOutlinedIcon} label="Likes" href="/likes" />
				<Sidebar.NavItem icon={BookmarkOutlinedIcon} label="Bookmarks" href="/bookmarks" />
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

				<div class="grow"></div>

				<div class="sticky bottom-0 flex flex-col border-t border-outline bg-background empty:hidden">
					<Switch>
						<Match when={swStatus() === SWStatus.UPDATING || swStatus() === SWStatus.INSTALLING}>
							<div class="flex gap-4 px-4 py-3 text-contrast opacity-50">
								<DownloadOutlinedIcon class="mt-0.5 text-xl" />
								<span class="text-base font-bold">
									{swStatus() === SWStatus.UPDATING ? `Updating app` : `Installing app`}
								</span>
							</div>
						</Match>

						<Match when={swStatus() === SWStatus.NEED_REFRESH}>
							<Sidebar.Item
								icon={DownloadOutlinedIcon}
								label="Update app"
								onClick={() => {
									close();
									updateSW();
								}}
							/>
						</Match>
					</Switch>
				</div>
			</Sidebar.Container>
		</>
	);
};

export default MainSidebarAuthenticated;

const AuthenticatedHeader = () => {
	const { close } = useModalContext();

	const { currentAccount, getAccounts, resumeSession } = useSession();
	const query = createProfileQuery(() => currentAccount!.did);

	const otherAccounts = createMemo(() => {
		return getAccounts()
			.filter((acc) => acc.did !== currentAccount!.did)
			.slice(0, 2);
	});

	const href = `/${currentAccount!.did}`;

	return (
		<Switch>
			<Match when={query.data}>
				{(profile) => {
					return (
						<div class="flex flex-col p-4">
							<div class="flex justify-between">
								<Avatar type={/* @once */ getUserAvatarType(profile())} src={profile().avatar} size="lg" />

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
												const profile = () => account.profile;

												const handleClick = () => {
													resumeSession(account.did);
													close();
												};

												return (
													<IconButton
														icon={() => {
															return (
																<Avatar
																	type={getUserAvatarType(profile())}
																	src={profile().avatar}
																	size="sm"
																/>
															);
														}}
														title={(() => {
															const handle = profile().handle;
															return handle !== 'handle.invalid' ? '@' + handle : account.did;
														})()}
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
								<p class="overflow-hidden break-words text-sm text-contrast-muted">
									{'@' + profile().handle}
								</p>
							</div>

							<div class="mt-3 flex min-w-0 flex-wrap gap-5 text-sm">
								<a href={`${href}/following`} onClick={close} class="hover:underline">
									<span class="font-bold">{formatCompact(profile().followsCount ?? 0)}</span>
									<span class="text-contrast-muted"> Following</span>
								</a>

								<a href={`${href}/followers`} onClick={close} class="hover:underline">
									<span class="font-bold">{formatCompact(profile().followersCount ?? 0)}</span>
									<span class="text-contrast-muted"> Followers</span>
								</a>
							</div>
						</div>
					);
				}}
			</Match>
		</Switch>
	);
};
