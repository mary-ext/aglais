import { type JSX, createMemo } from 'solid-js';

import type { AppBskyActorDefs } from '@atcute/client/lexicons';

import { moderateProfile } from '~/api/moderation/entities/profile';

import { isElementClicked } from '~/lib/interaction';
import { inject } from '~/lib/states/singleton';
import ModerationService from '~/lib/states/singletons/moderation';

import Avatar, { getUserAvatarType } from '../avatar';

export interface ProfileItemPressableProps {
	/** Expected to be static */
	item:
		| AppBskyActorDefs.ProfileView
		| AppBskyActorDefs.ProfileViewBasic
		| AppBskyActorDefs.ProfileViewDetailed;
	onClick: () => void;
	AsideComponent?: JSX.Element;
	FooterComponent?: JSX.Element;
}

const ProfileItemPressable = (props: ProfileItemPressableProps) => {
	const moderationOptions = inject(ModerationService);

	const profile = props.item;
	const onClick = props.onClick;

	const moderation = createMemo(() => moderateProfile(profile, moderationOptions()));

	const handleClick = (ev: MouseEvent | KeyboardEvent) => {
		if (!isElementClicked(ev)) {
			return;
		}

		ev.preventDefault();
		onClick();
	};

	return (
		<div
			tabindex={0}
			onClick={handleClick}
			onAuxClick={handleClick}
			onKeyDown={handleClick}
			class="flex cursor-pointer gap-3 px-4 py-3 outline-2 -outline-offset-2 outline-accent hover:bg-contrast/sm focus-visible:outline active:bg-contrast/sm-pressed"
		>
			<div class="shrink-0">
				<Avatar
					tabindex={-1}
					type={/* @once */ getUserAvatarType(profile)}
					src={/* @once */ profile.avatar}
					onClick={onClick}
					moderation={moderation()}
					size="lg"
				/>
			</div>

			<div class="flex min-w-0 grow flex-col gap-1">
				<div class="my-auto flex h-10 items-center justify-between gap-3">
					<div class="min-w-0 text-sm">
						<p class="overflow-hidden text-ellipsis whitespace-nowrap font-semibold">
							{/* @once */ profile.handle.toLowerCase()}
						</p>
						<p class="overflow-hidden text-ellipsis whitespace-nowrap text-contrast-muted">
							{/* @once */ profile.displayName}
						</p>
					</div>

					<div class="empty:hidden">{/* @once */ props.AsideComponent}</div>
				</div>

				{/* @once */ props.FooterComponent}
			</div>
		</div>
	);
};

export default ProfileItemPressable;
