import { useModalContext } from '~/globals/modals';

import CrossLargeOutlinedIcon from '../icons-central/cross-large-outline';
import ImageOutlinedIcon from '../icons-central/image-outline';
import * as Menu from '../menu';

export interface ImageUploadMenuProps {
	anchor: HTMLElement;
	onRemove: () => void;
	onUpload: () => void;
}

const ImageUploadMenu = (props: ImageUploadMenuProps) => {
	const { close } = useModalContext();

	const onRemove = props.onRemove;
	const onUpload = props.onUpload;

	return (
		<Menu.Container anchor={props.anchor}>
			<Menu.Item
				icon={ImageOutlinedIcon}
				label="Choose a new image"
				onClick={() => {
					close();
					onUpload();
				}}
			/>
			<Menu.Item
				icon={CrossLargeOutlinedIcon}
				label="Remove existing image"
				onClick={() => {
					close();
					onRemove();
				}}
			/>
		</Menu.Container>
	);
};

export default ImageUploadMenu;
