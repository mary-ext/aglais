import { type JSX, createMemo } from 'solid-js';

import type { AppBskyActorDefs } from '@atcute/client/lexicons';
import { useQueryClient } from '@mary/solid-query';

import { moderateProfile } from '~/api/moderation/entities/profile';
import { precacheProfile } from '~/api/queries-cache/profile-precache';

import { history } from '~/globals/navigation';

import { isElementAltClicked, isElementClicked } from '~/lib/interaction';
import { useModerationOptions } from '~/lib/states/moderation';

import Avatar, { getUserAvatarType } from '../avatar';

export interface ProfileItemProps {
	/** Expected to be static */
	item: AppBskyActorDefs.ProfileView;
	AsideComponent?: JSX.Element;
	FooterComponent?: JSX.Element;
}

const ProfileItem = (props: ProfileItemProps) => {
	const queryClient = useQueryClient();
	const moderationOptions = useModerationOptions();

	const profile = props.item;

	const href = `/${profile.did}`;

	const moderation = createMemo(() => moderateProfile(profile, moderationOptions()));

	const handleClick = (ev: MouseEvent | KeyboardEvent) => {
		if (!isElementClicked(ev)) {
			return;
		}

		ev.preventDefault();
		precacheProfile(queryClient, profile);

		if (isElementAltClicked(ev)) {
			window.open(href, '_blank');
		} else {
			history.navigate(href);
		}
	};

	return (
		<div
			tabindex={0}
			onClick={handleClick}
			onAuxClick={handleClick}
			onKeyDown={handleClick}
			class="flex cursor-pointer gap-3 px-4 py-3 hover:bg-contrast/sm active:bg-contrast/sm-pressed"
		>
			<div class="shrink-0">
				<Avatar
					type={/* @once */ getUserAvatarType(profile)}
					src={/* @once */ profile.avatar}
					href={href}
					onClick={() => precacheProfile(queryClient, profile)}
					moderation={moderation()}
					size="lg"
				/>
			</div>

			<div class="flex min-w-0 grow flex-col gap-1">
				<div class="my-auto flex h-10 items-center justify-between gap-3">
					<a href={href} onClick={() => precacheProfile(queryClient, profile)} class="min-w-0 text-sm">
						<p class="overflow-hidden text-ellipsis whitespace-nowrap font-semibold">
							{/* @once */ profile.handle}
						</p>
						<p class="overflow-hidden text-ellipsis whitespace-nowrap text-contrast-muted">
							{/* @once */ profile.displayName}
						</p>
					</a>

					<div class="empty:hidden">{/* @once */ props.AsideComponent}</div>
				</div>

				{/* @once */ props.FooterComponent}
			</div>
		</div>
	);
};

export default ProfileItem;
