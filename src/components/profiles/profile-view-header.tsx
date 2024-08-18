import { type Component, type ComponentProps, createMemo, type JSX, Match, Show, Switch } from 'solid-js';

import type { AppBskyActorDefs } from '@atcute/client/lexicons';

import { useProfileShadow } from '~/api/cache/profile-shadow';
import { ContextProfileMedia, getModerationUI } from '~/api/moderation';
import { moderateProfile } from '~/api/moderation/entities/profile';
import { parseAtUri } from '~/api/utils/strings';

import { openModal } from '~/globals/modals';

import { formatCompact } from '~/lib/intl/number';
import { useModerationOptions } from '~/lib/states/moderation';
import { useSession } from '~/lib/states/session';

import Avatar, { getUserAvatarType } from '../avatar';
import Button from '../button';
import IconButton from '../icon-button';
import MailOutlinedIcon from '../icons-central/mail-outline';
import MuteOutlinedIcon from '../icons-central/mute-outline';

import ImageViewerModalLazy from '../images/image-viewer-modal-lazy';

import EditProfileDialogLazy from './edit-profile-dialog-lazy';
import ProfileFollowButton from './profile-follow-button';

import DefaultLabelerAvatar from '~/assets/default-labeler-avatar.svg?url';
import DefaultUserAvatar from '~/assets/default-user-avatar.svg?url';

export interface ProfileViewHeader {
	/** Expects DID to be static */
	data: AppBskyActorDefs.ProfileViewDetailed;
	isPlaceholderData?: boolean;
}

const canShowKnownFollowers = (knownFollowers: AppBskyActorDefs.KnownFollowers | undefined) => {
	if (knownFollowers !== undefined && knownFollowers.followers.length > 0) {
		return knownFollowers;
	}
};

const ProfileViewHeader = (props: ProfileViewHeader) => {
	const moderationOptions = useModerationOptions();
	const { currentAccount } = useSession();

	const data = () => props.data;
	const viewer = () => data().viewer;

	const shadow = useProfileShadow(data);

	const did = data().did;
	const isLabeler = !!data().associated?.labeler;
	const isSelf = currentAccount?.did === data().did;

	const moderation = createMemo(() => moderateProfile(data(), moderationOptions()));

	const shouldBlurMedia = createMemo(() => getModerationUI(moderation(), ContextProfileMedia).b.length !== 0);

	return (
		<div class="flex flex-col">
			<Show when={data().banner} fallback={<div class="aspect-banner bg-outline-md"></div>}>
				{(uri) => (
					<button
						onClick={() => {
							const $uri = uri();
							openModal(() => <ImageViewerModalLazy images={[{ fullsize: $uri }]} />);
						}}
						class="group relative aspect-banner overflow-hidden bg-background"
					>
						<img
							src={uri()}
							class={
								`h-full w-full object-cover group-hover:opacity-75 group-active:opacity-75` +
								(shouldBlurMedia() ? ` scale-125 blur` : ``)
							}
						/>
					</button>
				)}
			</Show>

			<div class="z-1 flex flex-col gap-3 p-4">
				<div class="flex justify-between">
					<Show
						when={data().avatar}
						fallback={
							<div
								class={
									`-mt-11 h-20 w-20 shrink-0 overflow-hidden outline-2 outline-background outline` +
									(!isLabeler ? ` rounded-full` : ` rounded-lg`)
								}
							>
								<img
									src={!isLabeler ? DefaultUserAvatar : DefaultLabelerAvatar}
									class="h-full w-full object-cover"
								/>
							</div>
						}
					>
						{(uri) => (
							<button
								onClick={() => {
									const $uri = uri();
									openModal(() => <ImageViewerModalLazy images={[{ fullsize: $uri }]} />);
								}}
								class={
									`group relative -mt-11 h-20 w-20 shrink-0 overflow-hidden bg-background outline-2 outline-background outline focus-visible:outline-accent` +
									(!isLabeler ? ` rounded-full` : ` rounded-lg`)
								}
							>
								<img
									src={uri()}
									class={
										`h-full w-full object-cover group-hover:opacity-75 group-active:opacity-75` +
										(shouldBlurMedia() ? ` scale-125 blur` : ``)
									}
								/>
							</button>
						)}
					</Show>

					<div hidden={props.isPlaceholderData} class="flex items-center gap-3">
						<Switch>
							<Match when={isSelf}>
								<Button
									onClick={() => {
										openModal(() => <EditProfileDialogLazy profile={data()} />);
									}}
									variant="outline"
									size="md"
								>
									Edit profile
								</Button>
							</Match>

							<Match when={!data().viewer?.blockedBy}>
								<IconButton icon={MailOutlinedIcon} title="Message this user" disabled variant="outline" />
								<ProfileFollowButton profile={data()} />
							</Match>
						</Switch>
					</div>
				</div>

				<div>
					<p dir="auto" class="overflow-hidden break-words text-xl font-bold empty:hidden">
						{data().displayName}
					</p>

					<p class="flex min-w-0 items-start text-sm text-contrast-muted">
						<button class="overflow-hidden text-ellipsis break-words text-left hover:underline">
							{'@' + data().handle}
						</button>

						{(() => {
							if (viewer()?.followedBy) {
								return (
									<span class="ml-2 mt-0.5 shrink-0 rounded bg-contrast/10 px-1 py-px text-xs font-medium text-contrast-muted">
										Follows you
									</span>
								);
							}
						})()}
					</p>
				</div>

				<div class="whitespace-pre-wrap break-words text-sm empty:hidden">{data().description?.trim()}</div>

				<Show when={!props.isPlaceholderData}>
					<div class="flex min-w-0 flex-wrap gap-5 text-sm">
						<a href={`/${did}/following`} onClick={close} class="hover:underline">
							<span class="font-bold">{formatCompact(data().followsCount ?? 0)}</span>
							<span class="text-contrast-muted"> Following</span>
						</a>

						<a href={`/${did}/followers`} onClick={close} class="hover:underline">
							<span class="font-bold">{formatCompact(data().followersCount ?? 0)}</span>
							<span class="text-contrast-muted"> Followers</span>
						</a>
					</div>

					{!isSelf && (
						<Show
							when={canShowKnownFollowers(viewer()?.knownFollowers)}
							fallback={<p class="text-de text-contrast-muted">Not followed by anyone you're following</p>}
						>
							{(known) => {
								return (
									<a href={`/${did}/known-followers`} class="group flex items-start gap-3">
										<div class="z-0 flex shrink-0 flex-row-reverse">
											{known()
												.followers.slice(0, 3)
												.reverse()
												.map((profile, index) => {
													const moderation = createMemo(() => moderateProfile(profile, moderationOptions()));

													return (
														<Avatar
															type={/* @once */ getUserAvatarType(profile)}
															src={/* @once */ profile.avatar}
															moderation={moderation()}
															size="xs"
															class={
																'-m-0.5 box-content border-2 border-background' +
																(index !== 0 ? ` -mr-2` : ``)
															}
														/>
													);
												})}
										</div>

										<span class="text-pretty text-de text-contrast-muted group-hover:underline">
											{(() => {
												const followers = known().followers.slice(0, 2);
												const rest = known().count - followers.length;

												let array: string[] = [];

												for (const profile of followers) {
													array.push(profile.displayName || profile.handle);
												}

												if (rest > 0) {
													array.push(`${rest} others you follow`);
												}

												return `Followed by ` + new Intl.ListFormat('en-US').format(array);
											})()}
										</span>
									</a>
								);
							}}
						</Show>
					)}

					<Switch>
						<Match when={viewer()?.mutedByList}>
							{(list) => {
								const href = () => {
									const uri = parseAtUri(list().uri);
									return `/${uri.repo}/lists/${uri.rkey}`;
								};

								return (
									<ModerationBanner Icon={MuteOutlinedIcon}>
										Account is muted by{' '}
										<a href={href()} class="text-accent hover:underline">
											{list().name}
										</a>{' '}
										list
									</ModerationBanner>
								);
							}}
						</Match>

						<Match when={shadow().muted}>
							<ModerationBanner Icon={MuteOutlinedIcon}>
								You're currently muting this account.{' '}
								<button class="text-accent hover:underline">Unmute</button>
							</ModerationBanner>
						</Match>
					</Switch>
				</Show>
			</div>
		</div>
	);
};

export default ProfileViewHeader;

const ModerationBanner = (props: { Icon: Component<ComponentProps<'svg'>>; children: JSX.Element }) => {
	return (
		<div class="mt-1 flex gap-3">
			<div class="grid h-5 w-5 shrink-0 place-items-center">
				<props.Icon class="text-lg text-contrast-muted" />
			</div>

			<p class="text-sm text-contrast-muted">{props.children}</p>
		</div>
	);
};
