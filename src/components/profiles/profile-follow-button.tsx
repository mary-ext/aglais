import { type JSX, createMemo } from 'solid-js';

import type { AppBskyActorDefs } from '@atcute/client/lexicons';

import { useProfileShadow } from '~/api/cache/profile-shadow';
import { createProfileFollowMutation } from '~/api/mutations/profile';

import { openModal } from '~/globals/modals';

import { on } from '~/lib/utils/misc';

import Button from '../button';
import * as Prompt from '../prompt';

export interface ProfileFollowButtonProps {
	/** DID is expected to remain the same */
	profile: AppBskyActorDefs.ProfileView | AppBskyActorDefs.ProfileViewDetailed;
}

const ProfileFollowButton = (props: ProfileFollowButtonProps) => {
	const profile = () => props.profile;
	const shadow = useProfileShadow(profile);

	const isBlocked = createMemo(() => !!(profile().viewer?.blockedBy && shadow().blockUri));

	return on(isBlocked, ($isBlocked) => {
		if ($isBlocked) {
			return;
		}

		const isFollowing = () => shadow().followUri;
		const isBlocking = () => shadow().blockUri;

		const mutateFollow = createProfileFollowMutation(profile, shadow);

		return (
			<Button
				onClick={() => {
					if (isBlocking()) {
						return;
					}

					if (isFollowing()) {
						openModal(() => (
							<Prompt.Confirm
								title={`Unfollow @${profile().handle}`}
								description={<>Their posts will no longer show in your timeline.</>}
								onConfirm={() => mutateFollow(false)}
							/>
						));

						return;
					}

					mutateFollow(true);
				}}
				variant={isBlocking() ? 'danger' : isFollowing() ? 'outline' : 'primary'}
				size="md"
			>
				{isBlocking() ? `Blocked` : isFollowing() ? `Following` : `Follow`}
			</Button>
		);
	}) as unknown as JSX.Element;
};

export default ProfileFollowButton;
