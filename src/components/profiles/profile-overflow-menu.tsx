import { createMemo } from 'solid-js';

import type { AppBskyActorDefs } from '@atcute/client/lexicons';

import { useProfileShadow } from '~/api/cache/profile-shadow';

import { openModal, useModalContext } from '~/globals/modals';
import { history } from '~/globals/navigation';

import { useSession } from '~/lib/states/session';

import BlockOutlinedIcon from '~/components/icons-central/block-outline';
import BulletListOutlinedIcon from '~/components/icons-central/bullet-list-outline';
import CirclePlaceholderDashedOutlinedIcon from '~/components/icons-central/circle-placeholder-dashed-outline';
import FlagOutlinedIcon from '~/components/icons-central/flag-outline';
import HashtagOutlinedIcon from '~/components/icons-central/hashtag-outline';
import LinkOutlinedIcon from '~/components/icons-central/link-outline';
import ListSparkleOutlinedIcon from '~/components/icons-central/list-sparkle-outline';
import MuteOutlinedIcon from '~/components/icons-central/mute-outline';
import OpenInNewOutlinedIcon from '~/components/icons-central/open-in-new-outline';
import RepeatOffOutlinedIcon from '~/components/icons-central/repeat-off-outline';
import RepeatOutlinedIcon from '~/components/icons-central/repeat-outline';
import ShareOutlinedIcon from '~/components/icons-central/share-outline';
import VolumeFullOutlinedIcon from '~/components/icons-central/volume-full-outlined';
import * as Menu from '~/components/menu';
import BlockAccountPromptLazy from '~/components/moderation/block-account-prompt-lazy';
import MuteAccountPromptLazy from '~/components/moderation/mute-account-prompt-lazy';

export interface ProfileOverflowMenuProps {
	anchor: HTMLElement;
	/** Expected to be static */
	profile: AppBskyActorDefs.ProfileViewDetailed;
}

const hasWebShare = typeof navigator.share === 'function';

const ProfileOverflowMenu = (props: ProfileOverflowMenuProps) => {
	const { close } = useModalContext();
	const { currentAccount } = useSession();

	const profile = props.profile;
	const shadow = useProfileShadow(profile);

	const hasFeeds = !!profile.associated?.feedgens;
	const hasLists = !!profile.associated?.lists;

	const isRepostHidden = createMemo(() => {
		if (!currentAccount) {
			return false;
		}

		const hiddenReposts = currentAccount.preferences.moderation.hideReposts;
		return hiddenReposts.includes(profile.did);
	});

	const isMuted = createMemo(() => shadow().muted);
	const isBlocked = createMemo(() => shadow().blockUri);
	const isMe = !!currentAccount && currentAccount.did !== profile.did;

	return (
		<Menu.Container anchor={props.anchor}>
			{shadow().followUri && (
				<Menu.Item
					icon={!isRepostHidden() ? RepeatOffOutlinedIcon : RepeatOutlinedIcon}
					label={!isRepostHidden() ? `Turn off reposts` : `Turn on reposts`}
					onClick={() => {
						close();

						const hiddenReposts = currentAccount!.preferences.moderation.hideReposts;

						if (isRepostHidden()) {
							const index = hiddenReposts.indexOf(profile.did);
							hiddenReposts.splice(index, 1);
						} else {
							hiddenReposts.push(profile.did);
						}
					}}
				/>
			)}

			<Menu.Item
				icon={ListSparkleOutlinedIcon}
				label={`Add/remove account from lists`}
				onClick={() => {
					close();
				}}
			/>

			{hasLists && (
				<Menu.Item
					icon={BulletListOutlinedIcon}
					label="View account's lists"
					onClick={() => {
						close();
						history.navigate(`/${profile.did}/lists`);
					}}
				/>
			)}

			{hasFeeds && (
				<Menu.Item
					icon={HashtagOutlinedIcon}
					label="View account's feeds"
					onClick={() => {
						close();
						history.navigate(`/${profile.did}/feeds`);
					}}
				/>
			)}

			<Menu.Item
				icon={hasWebShare ? ShareOutlinedIcon : LinkOutlinedIcon}
				label={`${hasWebShare ? `Share` : `Copy`} link to profile`}
				onClick={() => {
					close();

					const url = location.origin + location.pathname;

					if (hasWebShare) {
						navigator.share({ url });
					} else {
						navigator.clipboard.writeText(url);
					}
				}}
			/>

			<Menu.Item
				icon={OpenInNewOutlinedIcon}
				label="Open in Bluesky app"
				onClick={() => {
					const uri = `https://bsky.app/profile/${profile.did}`;

					close();
					window.open(uri, '_blank');
				}}
			/>

			{isMe && (
				<>
					<Menu.Item
						icon={!isMuted() ? MuteOutlinedIcon : VolumeFullOutlinedIcon}
						label={!isMuted() ? `Mute account` : `Unmute account`}
						onClick={() => {
							close();
							openModal(() => <MuteAccountPromptLazy profile={profile} />);
						}}
					/>

					<Menu.Item
						icon={!isBlocked() ? BlockOutlinedIcon : CirclePlaceholderDashedOutlinedIcon}
						label={!isBlocked() ? `Block account` : `Unblock account`}
						onClick={() => {
							close();
							openModal(() => <BlockAccountPromptLazy profile={profile} />);
						}}
					/>

					<Menu.Item
						icon={FlagOutlinedIcon}
						label="Report account"
						onClick={() => {
							close();
						}}
					/>
				</>
			)}
		</Menu.Container>
	);
};

export default ProfileOverflowMenu;
