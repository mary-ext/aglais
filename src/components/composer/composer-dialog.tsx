import { createGuard } from '~/lib/hooks/guard';
import Button from '../button';
import * as Dialog from '../dialog';
import IconButton from '../icon-button';

import Divider from '../divider';
import AddOutlinedIcon from '../icons-central/add-outline';
import EarthOutlinedIcon from '../icons-central/earth-outline';
import EmojiSmileOutlinedIcon from '../icons-central/emoji-smile-outline';
import GifSquareOutlinedIcon from '../icons-central/gif-square-outline';
import ImageOutlinedIcon from '../icons-central/image-outline';
import ShieldOutlinedIcon from '../icons-central/shield-outline';

export interface ComposerDialogProps {}

const ComposerDialog = ({}: ComposerDialogProps) => {
	const [isCloseGuarded, addCloseGuard] = createGuard();
	const [isSubmitGuarded, addSubmitGuard] = createGuard();

	const handleClose = () => {
		if (isCloseGuarded()) {
		}
	};

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

				<Divider class="opacity-70" />

				<button class="flex h-11 select-none items-center gap-2 px-2 text-accent hover:bg-contrast/sm active:bg-contrast/sm-pressed">
					<EarthOutlinedIcon class="w-9 text-lg" />
					<span class="text-de font-medium">Everyone can reply</span>
				</button>

				<Divider class="opacity-70" />

				<div class="flex h-11 shrink-0 items-center justify-between px-2">
					<div class="flex items-center gap-2">
						<IconButton icon={ImageOutlinedIcon} title="Attach image..." variant="accent" />
						<IconButton icon={GifSquareOutlinedIcon} title="Attach GIF..." variant="accent" />
						<IconButton icon={EmojiSmileOutlinedIcon} title="Insert emoji..." variant="accent" />
					</div>

					<div class="flex items-center gap-2">
						<span class="text-xs font-medium text-contrast-muted">300</span>

						<IconButton
							icon={() => <span class="select-none text-xs font-bold">EN</span>}
							title="Select language..."
							variant="accent"
						/>

						<IconButton icon={ShieldOutlinedIcon} title="Select content warning..." variant="accent" />

						<div class="my-2 self-stretch border-l border-outline opacity-70"></div>

						<IconButton icon={AddOutlinedIcon} title="Add post" variant="accent" />
					</div>
				</div>
			</Dialog.Container>
		</>
	);
};

export default ComposerDialog;
