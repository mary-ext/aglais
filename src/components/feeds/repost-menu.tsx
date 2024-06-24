import { useModalContext } from '~/globals/modals';

import RepeatOutlinedIcon from '../icons-central/repeat-outline';
import WriteOutlinedIcon from '../icons-central/write-outline';
import * as Menu from '../menu';

export interface RepostMenuProps {
	anchor: HTMLElement;
	isReposted: boolean;
	onRepost: () => void;
	onQuote: () => void;
}

const RepostMenu = (props: RepostMenuProps) => {
	const { close } = useModalContext();

	return (
		<Menu.Container anchor={props.anchor} placement="bottom">
			<Menu.Item
				icon={RepeatOutlinedIcon}
				label={!props.isReposted ? `Repost` : `Undo repost`}
				onClick={() => {
					close();
					props.onRepost();
				}}
			/>

			<Menu.Item
				icon={WriteOutlinedIcon}
				label="Quote"
				onClick={() => {
					close();
					props.onQuote();
				}}
			/>
		</Menu.Container>
	);
};

export default RepostMenu;
