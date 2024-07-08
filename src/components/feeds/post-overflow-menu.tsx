import { createMemo } from 'solid-js';

import type { AppBskyFeedDefs } from '@mary/bluesky-client/lexicons';

import { createBookmarkEntryQuery } from '~/api/queries/bookmark-entry';

import { openModal, useModalContext } from '~/globals/modals';

import { useBookmarks } from '~/lib/states/bookmarks';

import BookmarkCheckOutlinedIcon from '../icons-central/bookmark-check-outline';
import BookmarkOutlinedIcon from '../icons-central/bookmark-outline';
import FolderAddOutlinedIcon from '../icons-central/folder-add-outline';
import * as Menu from '../menu';

import AddPostToFolderDialogLazy from '../bookmarks/add-post-to-folder-dialog-lazy';

export interface PostOverflowMenuProps {
	anchor: HTMLElement;
	/** Expected to be static */
	post: AppBskyFeedDefs.PostView;
}

const PostOverflowMenu = (props: PostOverflowMenuProps) => {
	const { close } = useModalContext();
	const bookmarks = useBookmarks();

	const post = props.post;

	const entry = createBookmarkEntryQuery(() => post.uri);
	const isBookmarked = createMemo(() => entry.data !== undefined);

	return (
		<Menu.Container anchor={props.anchor} placement="bottom-end" cover>
			<Menu.Item
				icon={!isBookmarked() ? BookmarkOutlinedIcon : BookmarkCheckOutlinedIcon}
				label={!isBookmarked() ? `Bookmark` : `Remove bookmark`}
				disabled={entry.isLoading}
				onClick={async () => {
					close();

					const db = await bookmarks.open();

					if (isBookmarked()) {
						db.delete('bookmarks', post.uri);
					} else {
						db.add('bookmarks', {
							view: post,
							bookmarked_at: Date.now(),
							tags: [],
						});
					}
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
