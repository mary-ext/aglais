import { createMemo, createSignal } from 'solid-js';

import type { AppBskyFeedDefs, AppBskyFeedPost, At } from '@atcute/client/lexicons';
import { useQueryClient } from '@mary/solid-query';

import { updatePostShadow, usePostShadow } from '~/api/cache/post-shadow';
import { createBookmarkEntryQuery } from '~/api/queries/bookmark-entry';
import { deleteRecord } from '~/api/utils/records';
import { parseAtUri } from '~/api/utils/strings';

import { openModal, useModalContext } from '~/globals/modals';

import { modelChecked } from '~/lib/input-refs';
import { useAgent } from '~/lib/states/agent';
import { useBookmarks } from '~/lib/states/bookmarks';
import { useSession } from '~/lib/states/session';

import AddPostToFolderDialogLazy from '../bookmarks/add-post-to-folder-dialog-lazy';
import CheckboxInput from '../checkbox-input';
import ComposerDialogLazy from '../composer/composer-dialog-lazy';
import BookmarkCheckOutlinedIcon from '../icons-central/bookmark-check-outline';
import BookmarkOutlinedIcon from '../icons-central/bookmark-outline';
import FolderAddOutlinedIcon from '../icons-central/folder-add-outline';
import PinOutlinedIcon from '../icons-central/pin-outline';
import TrashOutlinedIcon from '../icons-central/trash-outline';
import * as Menu from '../menu';
import * as Prompt from '../prompt';

import PinPostPromptLazy from './pin-post-prompt-lazy';

export interface DeletePromptProps {
	post: AppBskyFeedDefs.PostView;
	onPostDelete?: () => void;
	onReplyPublish?: () => void;
}

const DeletePrompt = (props: DeletePromptProps) => {
	const post = props.post;
	const queryClient = useQueryClient();
	const { currentAccount } = useSession();
	const { rpc } = useAgent();

	const [redraft, setRedraft] = createSignal(false);

	const deletePost = () => {
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
	};

	const redraftPost = () => {
		const record = post.record as AppBskyFeedPost.Record;
		const replyUri: At.Uri | undefined = record.reply?.parent?.uri;
		const quoteUri: At.Uri | undefined =
			(post.embed?.$type === 'app.bsky.embed.record#view' && post.embed.record.uri) ||
			(post.embed?.$type === 'app.bsky.embed.recordWithMedia#view' && post.embed.record.record.uri) ||
			undefined;

		const relatedPostUris = [];
		if (replyUri) relatedPostUris.push(replyUri);
		if (quoteUri) relatedPostUris.push(quoteUri);
		const relatedPostsPromise =
			relatedPostUris.length === 0
				? Promise.resolve({ reply: undefined, quote: undefined })
				: rpc
						.get('app.bsky.feed.getPosts', { params: { uris: relatedPostUris } })
						.then(({ data: { posts } }) => ({
							reply: replyUri ? posts.shift() : undefined,
							quote: quoteUri ? posts.shift() : undefined,
						}));

		relatedPostsPromise.then(({ reply, quote }) => {
			openModal(() => (
				<ComposerDialogLazy
					params={{ reply, quote, text: record.text, languages: record.langs }}
					initialComposerState={(_state) => {
						const origEmbed = post.embed;
						if (origEmbed?.$type === 'app.bsky.embed.images#view') {
							// TODO: reuse the embed cid instead of needing to reup them
							// by creating the record before deleting the old one, we avoid pds blob gc :)
							// state.posts[0].embed.media = { type: "image", images: ... };
						}
					}}
					onPublish={() => {
						props.onReplyPublish?.();
						deletePost();
					}}
				/>
			));
		});
	};

	return (
		<Prompt.Container>
			<Prompt.Title>Delete this post?</Prompt.Title>
			<Prompt.Description>
				This can't be undone, the post will be removed from your profile, timeline of your followers, and
				search results.
			</Prompt.Description>

			<div class="mt-2">
				<CheckboxInput
					ref={(node) => {
						modelChecked(node, redraft, setRedraft);
					}}
					label="Redraft this post before deleting"
				/>
			</div>
			<Prompt.Actions>
				<Prompt.Action
					variant="danger"
					onClick={() => {
						if (redraft()) {
							redraftPost();
							// TODO
						} else {
							deletePost();
						}
					}}
				>
					Delete
				</Prompt.Action>
			</Prompt.Actions>
		</Prompt.Container>
	);
};

export interface PostOverflowMenuProps {
	anchor: HTMLElement;
	/** Expected to be static */
	post: AppBskyFeedDefs.PostView;
	onPostDelete?: () => void;
	onReplyPublish?: () => void;
}

const PostOverflowMenu = (props: PostOverflowMenuProps) => {
	const { close } = useModalContext();
	const { currentAccount } = useSession();

	const bookmarks = useBookmarks();
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
							openModal(() => (
								<DeletePrompt
									post={props.post}
									onPostDelete={props.onPostDelete}
									onReplyPublish={props.onReplyPublish}
								/>
							));
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
