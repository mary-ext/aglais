import type { TagItem } from '~/lib/aglais-bookmarks/db';

import PencilOutlinedIcon from '../icons-central/pencil-outline';
import TrashOutlinedIcon from '../icons-central/trash-outline';
import * as Menu from '../menu';

export interface BookmarkFolderMenuProps {
	anchor: HTMLElement;
	/** Expected to be static */
	folder: TagItem;
}

const BookmarkFolderMenu = (props: BookmarkFolderMenuProps) => {
	return (
		<Menu.Container anchor={props.anchor}>
			<Menu.Item icon={PencilOutlinedIcon} label="Edit folder" />
			<Menu.Item icon={TrashOutlinedIcon} label="Delete folder" variant="danger" />
		</Menu.Container>
	);
};

export default BookmarkFolderMenu;
