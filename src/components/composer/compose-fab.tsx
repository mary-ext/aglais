import { openModal } from '~/globals/modals';

import FAB from '../fab';
import WriteOutlinedIcon from '../icons-central/write-outline';

import ComposerDialogLazy from './composer-dialog-lazy';

export interface ComposeFABProps {}

const ComposeFAB = ({}: ComposeFABProps) => {
	return (
		<FAB
			icon={WriteOutlinedIcon}
			label="Write new post"
			onClick={() => {
				openModal(() => <ComposerDialogLazy />);
			}}
		/>
	);
};

export default ComposeFAB;
