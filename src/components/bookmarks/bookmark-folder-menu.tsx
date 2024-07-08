import { openModal, useModalContext } from '~/globals/modals';

import type { TagItem } from '~/lib/aglais-bookmarks/db';

import PencilOutlinedIcon from '../icons-central/pencil-outline';
import TrashOutlinedIcon from '../icons-central/trash-outline';
import * as Menu from '../menu';
import * as Prompt from '../prompt';

export interface BookmarkFolderMenuProps {
	anchor: HTMLElement;
	/** Expected to be static */
	folder: TagItem;
}

const BookmarkFolderMenu = (props: BookmarkFolderMenuProps) => {
	const { close } = useModalContext();
	const folder = props.folder;

	return (
		<Menu.Container anchor={props.anchor}>
			<Menu.Item
				icon={PencilOutlinedIcon}
				label="Edit folder"
				onClick={() => {
					close();
				}}
			/>
			<Menu.Item
				icon={TrashOutlinedIcon}
				label="Delete folder"
				variant="danger"
				onClick={() => {
					close();
					openModal(() => <Prompt.Confirm title={`Delete ${folder.name}?`}
						description={``}
					/>);
				}}
			/>
		</Menu.Container>
	);
};

export default BookmarkFolderMenu;
