import { createMemo, Match, Show, Switch } from 'solid-js';

import type { AppBskyActorDefs } from '@mary/bluesky-client/lexicons';

import { useProfileShadow } from '~/api/cache/profile-shadow';
import { ContextProfileMedia, getModerationUI } from '~/api/moderation';
import { moderateProfile } from '~/api/moderation/entities/profile';

import { openModal } from '~/globals/modals';

import { formatCompact } from '~/lib/intl/number';
import { useModerationOptions } from '~/lib/states/moderation';
import { useSession } from '~/lib/states/session';

import Button from '../button';
import IconButton from '../icon-button';
import MailOutlinedIcon from '../icons-central/mail-outline';

import ImageViewerModalLazy from '../images/image-viewer-modal-lazy';

import DefaultUserAvatar from '~/assets/default-user-avatar.svg?url';
import DefaultLabelerAvatar from '~/assets/default-labeler-avatar.svg?url';

export interface ProfileViewHeader {
	data: AppBskyActorDefs.ProfileViewDetailed;
	isPlaceholderData?: boolean;
}

const ProfileViewHeader = (props: ProfileViewHeader) => {
	const moderationOptions = useModerationOptions();
	const { currentAccount } = useSession();

	const data = () => props.data;
	const viewer = () => data().viewer;
	const isLabeler = !!data().associated?.labeler;

	const shadow = useProfileShadow(data);
	const moderation = createMemo(() => moderateProfile(data(), shadow(), moderationOptions()));

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
							<div class="-mt-11 h-20 w-20 shrink-0 overflow-hidden rounded-full outline-2 outline-background outline">
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

					<div class="flex items-center gap-3">
						<Switch>
							<Match when={data().did === currentAccount?.did}>
								<Button variant="outline" size="md" disabled>
									Edit profile
								</Button>
							</Match>

							<Match when>
								<IconButton icon={MailOutlinedIcon} title="Message this user" disabled variant="outline" />
								<Button variant="primary" size="md" disabled>
									Follow
								</Button>
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

				<div hidden={props.isPlaceholderData} class="whitespace-pre-wrap break-words text-sm empty:hidden">
					{data().description?.trim()}
				</div>

				<div hidden={props.isPlaceholderData} class="flex min-w-0 flex-wrap gap-5 text-sm">
					<a href={`/${data().did}/following`} onClick={close} class="hover:underline">
						<span class="font-bold">{formatCompact(data().followsCount ?? 0)}</span>
						<span class="text-contrast-muted"> Following</span>
					</a>

					<a href={`/${data().did}/followers`} onClick={close} class="hover:underline">
						<span class="font-bold">{formatCompact(data().followersCount ?? 0)}</span>
						<span class="text-contrast-muted"> Followers</span>
					</a>
				</div>
			</div>
		</div>
	);
};

export default ProfileViewHeader;
