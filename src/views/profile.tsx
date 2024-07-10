import { createMemo, Match, Show, Switch } from 'solid-js';

import type { AppBskyActorDefs } from '@mary/bluesky-client/lexicons';
import { useQueryClient } from '@mary/solid-query';

import { useProfileShadow } from '~/api/cache/profile-shadow';
import { ContextProfileMedia, getModerationUI } from '~/api/moderation';
import { moderateProfile } from '~/api/moderation/entities/profile';
import { createProfileQuery } from '~/api/queries/profile';
import { isDid } from '~/api/utils/strings';

import { history } from '~/globals/navigation';

import { formatCompact } from '~/lib/intl/number';
import { useParams } from '~/lib/navigation/router';
import { useModerationOptions } from '~/lib/states/moderation';
import { useSession } from '~/lib/states/session';

import Button from '~/components/button';
import CircularProgressView from '~/components/circular-progress-view';
import Divider from '~/components/divider';
import IconButton from '~/components/icon-button';
import MailOutlinedIcon from '~/components/icons-central/mail-outline';
import MoreHorizOutlinedIcon from '~/components/icons-central/more-horiz-outline';
import * as Page from '~/components/page';

import DefaultUserAvatar from '~/assets/default-user-avatar.svg?url';

const ProfilePage = () => {
	const { didOrHandle } = useParams();

	const queryClient = useQueryClient();
	const profile = createProfileQuery(() => didOrHandle);

	return (
		<>
			<Page.Header>
				<Page.HeaderAccessory>
					<Page.Back to="/" />
				</Page.HeaderAccessory>

				<Switch>
					<Match when={profile.data}>
						{(data) => (
							<>
								<Page.Heading
									title={data().displayName}
									subtitle={(() => {
										if (!profile.isPlaceholderData) {
											return `${formatCompact(data().postsCount ?? 0)} posts`;
										}
									})()}
								/>

								<Page.HeaderAccessory>
									<IconButton
										icon={MoreHorizOutlinedIcon}
										title="Actions"
										disabled={profile.isPlaceholderData}
									/>
								</Page.HeaderAccessory>
							</>
						)}
					</Match>

					<Match when>
						<Page.Heading title="Profile" />
					</Match>
				</Switch>
			</Page.Header>

			<Switch>
				<Match
					when={(() => {
						if (!isDid(didOrHandle)) {
							return profile.data;
						}
					})()}
					keyed
				>
					{(data) => {
						queryClient.setQueryData(['profile', data.did], data);
						history.navigate(`/${data.did}`, { replace: true });
						return null;
					}}
				</Match>

				<Match when={profile.data}>
					{(data) => <ProfileView data={data()} isPlaceholderData={profile.isPlaceholderData} />}
				</Match>

				<Match when>
					<CircularProgressView />
				</Match>
			</Switch>
		</>
	);
};

export default ProfilePage;

type ProfileData = AppBskyActorDefs.ProfileViewDetailed;

const ProfileView = (props: { data: ProfileData; isPlaceholderData?: boolean }) => {
	return (
		<>
			<ProfileViewHeader {...props} />
			{!props.isPlaceholderData ? <Divider /> : <CircularProgressView />}
		</>
	);
};

const ProfileViewHeader = (props: { data: ProfileData; isPlaceholderData?: boolean }) => {
	const moderationOptions = useModerationOptions();
	const { currentAccount } = useSession();

	const data = () => props.data;
	const viewer = () => data().viewer;

	const shadow = useProfileShadow(data);
	const moderation = createMemo(() => moderateProfile(data(), shadow(), moderationOptions()));

	const shouldBlurMedia = createMemo(() => getModerationUI(moderation(), ContextProfileMedia).b.length !== 0);

	return (
		<div class="flex flex-col">
			<Show when={data().banner} fallback={<div class="aspect-banner bg-outline-md"></div>}>
				{(uri) => (
					<button class="group relative aspect-banner bg-background">
						<img
							src={uri()}
							class="h-full w-full object-cover group-hover:opacity-75 group-active:opacity-75"
						/>

						<div hidden={!shouldBlurMedia()} class="absolute inset-0 backdrop-blur"></div>
					</button>
				)}
			</Show>

			<div class="z-1 flex flex-col gap-3 p-4">
				<div class="flex justify-between">
					<Show
						when={data().avatar}
						fallback={
							<div class="-mt-11 h-20 w-20 shrink-0 overflow-hidden rounded-full outline-2 outline-background outline">
								<img src={DefaultUserAvatar} class="h-full w-full object-cover" />
							</div>
						}
					>
						{(uri) => (
							<button class="group relative -mt-11 h-20 w-20 shrink-0 overflow-hidden rounded-full bg-background outline-2 outline-background outline focus-visible:outline-accent">
								<img
									src={uri()}
									class="h-full w-full object-cover group-hover:opacity-75 group-active:opacity-75"
								/>

								<div hidden={!shouldBlurMedia()} class="absolute inset-0 backdrop-blur"></div>
							</button>
						)}
					</Show>

					<div class="flex items-center gap-3">
						<Switch>
							<Match when={data().did === currentAccount?.did}>
								<Button variant="outline" size="md">
									Edit profile
								</Button>
							</Match>

							<Match when>
								<IconButton icon={MailOutlinedIcon} title="Message this user" variant="outline" />
								<Button variant="primary" size="md">
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
