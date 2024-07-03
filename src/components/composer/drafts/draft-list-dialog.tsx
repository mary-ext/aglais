import * as Dialog from '../../dialog';

const DraftListDialog = () => {
	return (
		<>
			<Dialog.Backdrop />
			<Dialog.Container>
				<Dialog.Header>
					<Dialog.HeaderAccessory>
						<Dialog.Close />
					</Dialog.HeaderAccessory>

					<Dialog.Heading title="Unsent drafts" />
				</Dialog.Header>
			</Dialog.Container>
		</>
	);
};

export default DraftListDialog;
