import { useQueryClient } from '@mary/solid-query';

import { openModal, useModalContext } from '~/globals/modals';

import type { TagItem } from '~/lib/aglais-bookmarks/db';
import { useBookmarks } from '~/lib/states/bookmarks';

import PencilOutlinedIcon from '../icons-central/pencil-outline';
import TrashOutlinedIcon from '../icons-central/trash-outline';
import * as Menu from '../menu';
import * as Prompt from '../prompt';

import BookmarkFolderFormDialogLazy from './bookmark-folder-form-dialog-lazy';

export interface BookmarkFolderMenuProps {
	anchor: HTMLElement;
	/** Expected to be static */
	folder: TagItem;
	onDelete?: () => void;
}

const BookmarkFolderMenu = (props: BookmarkFolderMenuProps) => {
	const { close } = useModalContext();

	const bookmarks = useBookmarks();
	const queryClient = useQueryClient();

	const folder = props.folder;

	return (
		<Menu.Container anchor={props.anchor}>
			<Menu.Item
				icon={PencilOutlinedIcon}
				label="Edit folder"
				onClick={() => {
					close();
					openModal(() => <BookmarkFolderFormDialogLazy folder={folder} />);
				}}
			/>
			<Menu.Item
				icon={TrashOutlinedIcon}
				label="Delete folder"
				variant="danger"
				onClick={() => {
					close();
					openModal(() => (
						<Prompt.Confirm
							title={`Delete this Bookmark Folder?`}
							description={`Any saved bookmarks will remain.`}
							danger
							confirmLabel="Delete"
							onConfirm={async () => {
								const db = await bookmarks.open();
								db.delete('tags', folder.id);

								queryClient.invalidateQueries({ queryKey: ['bookmark-meta'], exact: true });
							}}
						/>
					));
				}}
			/>
		</Menu.Container>
	);
};

export default BookmarkFolderMenu;
