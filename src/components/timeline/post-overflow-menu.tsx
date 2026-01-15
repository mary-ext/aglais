import type { AppBskyFeedDefs } from '@atcute/bluesky';

import { usePostShadow } from '~/api/cache/post-shadow';
import { createPostBookmarkMutation } from '~/api/mutations/post';

import { openModal, useModalContext } from '~/globals/modals';

import { useSession } from '~/lib/states/session';

import BookmarkCheckOutlinedIcon from '~/components/icons-central/bookmark-check-outline';
import BookmarkOutlinedIcon from '~/components/icons-central/bookmark-outline';
import PinOutlinedIcon from '~/components/icons-central/pin-outline';
import StepBackOutlinedIcon from '~/components/icons-central/step-back-outline';
import TrashOutlinedIcon from '~/components/icons-central/trash-outline';
import * as Menu from '~/components/menu';

import DeletePostPromptLazy from './delete-post-prompt-lazy';
import PinPostPromptLazy from './pin-post-prompt-lazy';
import RevisePostPromptLazy from './revise-post-prompt-lazy';

export interface PostOverflowMenuProps {
	anchor: HTMLElement;
	/** Expected to be static */
	post: AppBskyFeedDefs.PostView;
	onPostDelete?: () => void;
	onPostRedraft?: () => void;
}

const PostOverflowMenu = (props: PostOverflowMenuProps) => {
	const { close } = useModalContext();
	const { currentAccount } = useSession();

	const post = props.post;
	const shadow = usePostShadow(post);

	const isOurPost = currentAccount && currentAccount.did === post.author.did;

	const mutateBookmark = createPostBookmarkMutation(() => post, shadow);

	return (
		<Menu.Container anchor={props.anchor} placement="bottom-end" cover>
			{isOurPost && (
				<>
					<Menu.Item
						icon={TrashOutlinedIcon}
						label="Delete"
						variant="danger"
						onClick={() => {
							close();
							openModal(() => <DeletePostPromptLazy post={post} onPostDelete={props.onPostDelete} />);
						}}
					/>

					<Menu.Item
						icon={StepBackOutlinedIcon}
						label="Revise"
						onClick={() => {
							close();
							openModal(() => <RevisePostPromptLazy post={post} onPostRevise={props.onPostRedraft} />);
						}}
					/>

					<Menu.Item
						icon={PinOutlinedIcon}
						label={!shadow().pinned ? `Pin to profile` : `Unpin from profile`}
						onClick={() => {
							close();
							openModal(() => <PinPostPromptLazy post={post} />);
						}}
					/>
				</>
			)}

			<Menu.Item
				icon={!shadow().bookmarked ? BookmarkOutlinedIcon : BookmarkCheckOutlinedIcon}
				label={!shadow().bookmarked ? `Bookmark` : `Remove bookmark`}
				onClick={() => {
					close();
					mutateBookmark(!shadow().bookmarked);
				}}
			/>
		</Menu.Container>
	);
};

export default PostOverflowMenu;
