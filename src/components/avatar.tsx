import { Match, Switch } from 'solid-js';

import type { AppBskyActorDefs } from '@atcute/client/lexicons';

import {
	ContextProfileMedia,
	type ModerationCause,
	type ModerationContext,
	getModerationUI,
} from '~/api/moderation';

import DefaultFeedAvatar from '~/assets/default-feed-avatar.svg?url';
import DefaultLabelerAvatar from '~/assets/default-labeler-avatar.svg?url';
import DefaultListAvatar from '~/assets/default-list-avatar.svg?url';
import DefaultUserAvatar from '~/assets/default-user-avatar.svg?url';

const AVATARS = {
	generator: DefaultFeedAvatar,
	labeler: DefaultLabelerAvatar,
	list: DefaultListAvatar,
	user: DefaultUserAvatar,
};

export interface AvatarProps {
	type: keyof typeof AVATARS;
	src?: string;
	moderation?: ModerationCause[];
	modContext?: ModerationContext;
	title?: string;
	disabled?: boolean;
	href?: string;
	onClick?: () => void;

	class?: string;
	size?: 'xs' | 'sm' | 'in' | 'md' | 'lg' | null;
}

export const getUserAvatarType = (
	profile:
		| AppBskyActorDefs.ProfileViewBasic
		| AppBskyActorDefs.ProfileView
		| AppBskyActorDefs.ProfileViewDetailed
		| undefined,
): AvatarProps['type'] => {
	return profile?.associated?.labeler ? 'labeler' : 'user';
};

const Avatar = (props: AvatarProps) => {
	const hasModeration = 'moderation' in props;

	const shouldBlurAvatar = hasModeration
		? () => getModerationUI(props.moderation!, props.modContext ?? ContextProfileMedia).b.length > 0
		: undefined;

	return (
		<Switch>
			<Match when={!props.disabled && props.href}>
				{(href) => (
					<a href={href()} title={props.title} onClick={props.onClick} class={avatarClassNames(props, true)}>
						{renderAvatar(props.type, props.src, shouldBlurAvatar)}
					</a>
				)}
			</Match>

			<Match when={!props.disabled && props.onClick} keyed>
				{(onClick) => (
					<button title={props.title} onClick={onClick} class={avatarClassNames(props, true)}>
						{renderAvatar(props.type, props.src, shouldBlurAvatar)}
					</button>
				)}
			</Match>

			<Match when>
				<div title={props.title} class={avatarClassNames(props, false)}>
					{renderAvatar(props.type, props.src, shouldBlurAvatar)}
				</div>
			</Match>
		</Switch>
	);
};

export default Avatar;

const renderAvatar = (type: keyof typeof AVATARS, src: string | undefined, shouldBlur?: () => boolean) => {
	return (
		<img
			src={
				/* @once */ src ? src.replace('/img/avatar/plain/', '/img/avatar_thumbnail/plain/') : AVATARS[type]
			}
			class={`h-full w-full` + (src && shouldBlur?.() ? ` scale-125 blur` : ``)}
		/>
	);
};

const avatarClassNames = (
	{ type, size = 'md', class: className }: AvatarProps,
	interactive: boolean,
): string => {
	let cn = `block shrink-0 overflow-hidden bg-outline-md`;

	if (type === 'user') {
		cn += ` rounded-full`;
	} else {
		cn += ` rounded-md`;
	}

	if (interactive) {
		cn += ` hover:opacity-80`;
	}

	if (size === 'md') {
		cn += ` h-9 w-9`;
	} else if (size === 'sm') {
		cn += ` h-6 w-6`;
	} else if (size === 'xs') {
		cn += ` h-5 w-5`;
	} else if (size === 'lg') {
		cn += ` h-10 w-10`;
	} else if (size === 'in') {
		cn += ` h-8 w-8`;
	}

	if (className) {
		return `${cn} ${className}`;
	} else {
		return cn;
	}
};
