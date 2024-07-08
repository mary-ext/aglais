import { createMemo, For } from 'solid-js';

import type { AppBskyFeedDefs } from '@mary/bluesky-client/lexicons';
import { useQueryClient } from '@mary/solid-query';

import { createBookmarkMetaQuery } from '~/api/queries/bookmark';
import { createBookmarkEntryQuery } from '~/api/queries/bookmark-entry';

import { openModal, useModalContext } from '~/globals/modals';

import { createDerivedSignal } from '~/lib/hooks/derived-signal';
import { isSetEqual } from '~/lib/misc';
import { useBookmarks } from '~/lib/states/bookmarks';

import Button from '../button';
import * as Dialog from '../dialog';
import CheckOutlinedIcon from '../icons-central/check-outline';

import BookmarkFolderAvatar from './bookmark-folder-avatar';
import BookmarkFolderFormDialogLazy from './bookmark-folder-form-dialog-lazy';

export interface AddPostToFolderDialogProps {
	/** Expected to be static */
	post: AppBskyFeedDefs.PostView;
	onSave?: () => void;
}

const AddPostToFolderDialog = ({ post, onSave }: AddPostToFolderDialogProps) => {
	const { close } = useModalContext();

	const bookmarks = useBookmarks();
	const queryClient = useQueryClient();

	const meta = createBookmarkMetaQuery();
	const entry = createBookmarkEntryQuery(() => post.uri);

	const prevFolderIds = createMemo(() => {
		const $entry = entry.data;
		return $entry ? $entry.tags : [];
	});

	const [folderIds, setFolderIds] = createDerivedSignal(prevFolderIds);
	const isEqual = createMemo(() => isSetEqual(new Set(prevFolderIds()), new Set(folderIds())));

	const handleSave = async () => {
		const db = await bookmarks.open();
		const existing = entry.data;

		await db.put('bookmarks', {
			view: post,
			tags: folderIds(),
			bookmarked_at: existing ? existing.bookmarked_at : Date.now(),
		});

		onSave?.();
		close();

		queryClient.invalidateQueries({ queryKey: ['bookmark-meta'], exact: true });
		queryClient.invalidateQueries({ queryKey: ['bookmark-entry', post.uri], exact: true });
	};

	return (
		<>
			<Dialog.Backdrop />
			<Dialog.Container fullHeight>
				<Dialog.Header>
					<Dialog.HeaderAccessory>
						<Dialog.Close />
					</Dialog.HeaderAccessory>

					<Dialog.Heading title="Add to Bookmark Folder" />

					<Dialog.HeaderAccessory>
						<Button onClick={handleSave} disabled={isEqual()} variant="primary">
							Save
						</Button>
					</Dialog.HeaderAccessory>
				</Dialog.Header>

				<Dialog.Body unpadded class="flex flex-col">
					<button
						type="button"
						onClick={() => {
							openModal(() => <BookmarkFolderFormDialogLazy onSave={() => meta.refetch()} />);
						}}
						class="px-4 py-3 text-left text-de text-accent hover:bg-contrast/md active:bg-contrast/sm-pressed"
					>
						Create a new Bookmark Folder
					</button>

					<For each={meta.data?.tags}>
						{(folder) => {
							const isSelected = createMemo(() => folderIds().includes(folder.id));

							return (
								<button
									type="button"
									aria-selected={isSelected()}
									onClick={() => {
										setFolderIds((ids) => {
											if (isSelected()) {
												return ids.toSpliced(ids.indexOf(folder.id), 1);
											} else {
												return ids.concat(folder.id);
											}
										});
									}}
									class="flex items-center gap-4 px-4 py-3 text-left hover:bg-contrast/sm active:bg-contrast/sm-pressed"
								>
									<BookmarkFolderAvatar color={/* @once */ folder.color} icon={/* @once */ folder.icon} />

									<span class="min-w-0 grow overflow-hidden text-ellipsis whitespace-nowrap break-words text-sm font-bold">
										{/* @once */ folder.name}
									</span>

									<CheckOutlinedIcon
										class={
											'-my-0.5 -mr-1 shrink-0 text-2xl text-accent' + (!isSelected() ? ` invisible` : ``)
										}
									/>
								</button>
							);
						}}
					</For>
				</Dialog.Body>
			</Dialog.Container>
		</>
	);
};

export default AddPostToFolderDialog;
