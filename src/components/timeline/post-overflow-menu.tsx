import { createMemo } from 'solid-js';

import type { AppBskyFeedDefs } from '@atcute/bluesky';
import { useQueryClient } from '@mary/solid-query';

import { usePostShadow } from '~/api/cache/post-shadow';
import { createBookmarkEntryQuery } from '~/api/queries/bookmark-entry';

import { openModal, useModalContext } from '~/globals/modals';

import { useSession } from '~/lib/states/session';
import { inject } from '~/lib/states/singleton';
import BookmarksService from '~/lib/states/singletons/bookmarks';

import AddPostToFolderDialogLazy from '~/components/bookmarks/add-post-to-folder-dialog-lazy';
import BookmarkCheckOutlinedIcon from '~/components/icons-central/bookmark-check-outline';
import BookmarkOutlinedIcon from '~/components/icons-central/bookmark-outline';
import FolderAddOutlinedIcon from '~/components/icons-central/folder-add-outline';
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

	const bookmarks = inject(BookmarksService);
	const queryClient = useQueryClient();

	const post = props.post;
	const shadow = usePostShadow(post);

	const isOurPost = currentAccount && currentAccount.did === post.author.did;

	const bookmarkQuery = createBookmarkEntryQuery(() => post.uri);
	const isBookmarked = createMemo(() => bookmarkQuery.data.item !== undefined);

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
				icon={!isBookmarked() ? BookmarkOutlinedIcon : BookmarkCheckOutlinedIcon}
				label={!isBookmarked() ? `Bookmark` : `Remove bookmark`}
				disabled={bookmarkQuery.isLoading}
				onClick={async () => {
					close();

					const db = await bookmarks.open();

					if (isBookmarked()) {
						await db.delete('bookmarks', post.uri);
					} else {
						await db.add('bookmarks', {
							view: post,
							bookmarked_at: Date.now(),
							tags: [],
						});
					}

					queryClient.invalidateQueries({ queryKey: ['bookmark-entry', post.uri], exact: true });
				}}
			/>

			<Menu.Item
				icon={FolderAddOutlinedIcon}
				label="Add to Bookmark Folder"
				onClick={() => {
					close();
					openModal(() => <AddPostToFolderDialogLazy post={post} />);
				}}
			/>
		</Menu.Container>
	);
};

export default PostOverflowMenu;
