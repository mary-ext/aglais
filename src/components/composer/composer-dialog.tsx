import Button from '../button';
import * as Dialog from '../dialog';

export interface ComposerDialogProps {}

const ComposerDialog = ({}: ComposerDialogProps) => {
	return (
		<>
			<Dialog.Backdrop />
			<Dialog.Container>
				<Dialog.Header>
					<Dialog.HeaderAccessory>
						<Dialog.Close />
					</Dialog.HeaderAccessory>

					<Dialog.HeaderAccessory>
						<Button variant="primary">Post</Button>
					</Dialog.HeaderAccessory>
				</Dialog.Header>

				<Dialog.Body></Dialog.Body>
			</Dialog.Container>
		</>
	);
};

export default ComposerDialog;
