import type { ModerationLabeler } from '~/api/moderation';

import { useModalContext } from '~/globals/modals';
import { history } from '~/globals/navigation';

import PersonOutlinedIcon from '~/components/icons-central/person-outline';
import * as Menu from '~/components/menu';
import ShieldOffOutlinedIcon from '~/components/icons-central/shield-off-outline';

export interface LabelerOverflowMenuProps {
	anchor: HTMLElement;
	labeler: ModerationLabeler;
	isSubscribed: boolean;
	onUnsubscribe: () => void;
}

const LabelerOverflowMenu = (props: LabelerOverflowMenuProps) => {
	const { close } = useModalContext();

	const labeler = () => props.labeler;
	const did = labeler().did;

	const onUnsubscribe = props.onUnsubscribe;

	return (
		<Menu.Container anchor={props.anchor}>
			<Menu.Item
				icon={PersonOutlinedIcon}
				label="View profile"
				onClick={() => {
					close();
					history.navigate(`/${did}`);
				}}
			/>

			{props.isSubscribed && (
				<Menu.Item
					icon={ShieldOffOutlinedIcon}
					label="Unsubscribe"
					onClick={() => {
						close();
						onUnsubscribe();
					}}
				/>
			)}
		</Menu.Container>
	);
};

export default LabelerOverflowMenu;
