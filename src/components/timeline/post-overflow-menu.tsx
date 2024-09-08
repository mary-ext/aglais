import { createMemo } from 'solid-js';

import type { AppBskyFeedDefs } from '@atcute/client/lexicons';
import { useQueryClient } from '@mary/solid-query';

import { updatePostShadow } from '~/api/cache/post-shadow';
import { createBookmarkEntryQuery } from '~/api/queries/bookmark-entry';
import { deleteRecord } from '~/api/utils/records';
import { parseAtUri } from '~/api/utils/strings';

import { openModal, useModalContext } from '~/globals/modals';

import { useAgent } from '~/lib/states/agent';
import { useBookmarks } from '~/lib/states/bookmarks';
import { useSession } from '~/lib/states/session';

import AddPostToFolderDialogLazy from '../bookmarks/add-post-to-folder-dialog-lazy';
import BookmarkCheckOutlinedIcon from '../icons-central/bookmark-check-outline';
import BookmarkOutlinedIcon from '../icons-central/bookmark-outline';
import FolderAddOutlinedIcon from '../icons-central/folder-add-outline';
import OpenInNewOutlinedIcon from '../icons-central/open-in-new-outline';
import TrashOutlinedIcon from '../icons-central/trash-outline';
import * as Menu from '../menu';
import * as Prompt from '../prompt';

export interface PostOverflowMenuProps {
	anchor: HTMLElement;
	/** Expected to be static */
	post: AppBskyFeedDefs.PostView;
	onPostDelete?: () => void;
}

const PostOverflowMenu = (props: PostOverflowMenuProps) => {
	const { close } = useModalContext();
	const { currentAccount } = useSession();
	const { rpc } = useAgent();

	const bookmarks = useBookmarks();
	const queryClient = useQueryClient();

	const post = props.post;
	const isOurPost = currentAccount && currentAccount.did === post.author.did;

	const query = createBookmarkEntryQuery(() => post.uri);
	const isBookmarked = createMemo(() => query.data.item !== undefined);

	return (
		<Menu.Container anchor={props.anchor} placement="bottom-end" cover>
			<Menu.Item
				icon={OpenInNewOutlinedIcon}
				label="Open in Bluesky app"
				onClick={() => {
					const uri = `https://bsky.app/profile/${post.author.did}/post/${parseAtUri(post.uri).rkey}`;

					close();
					window.open(uri, '_blank');
				}}
			/>

			{isOurPost && (
				<>
					<Menu.Item
						icon={TrashOutlinedIcon}
						label="Delete"
						variant="danger"
						onClick={() => {
							close();
							openModal(() => (
								<Prompt.Confirm
									title="Delete this post?"
									description="This can't be undone, the post will be removed from your profile, timeline of your followers, and search results."
									danger
									confirmLabel="Delete"
									onConfirm={() => {
										const onPostDelete = props.onPostDelete;

										const uri = parseAtUri(post.uri);
										const promise = deleteRecord(rpc, {
											repo: currentAccount!.did,
											collection: 'app.bsky.feed.post',
											rkey: uri.rkey,
										});

										updatePostShadow(queryClient, post.uri, { deleted: true });

										if (onPostDelete) {
											promise.then(onPostDelete);
										}
									}}
								/>
							));
						}}
					/>
				</>
			)}

			<Menu.Item
				icon={!isBookmarked() ? BookmarkOutlinedIcon : BookmarkCheckOutlinedIcon}
				label={!isBookmarked() ? `Bookmark` : `Remove bookmark`}
				disabled={query.isLoading}
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
