import { createEffect, createSignal, type JSX } from 'solid-js';

import { remove as removeExif } from '@mary/exif-rm';

import { hasModals, openModal } from '~/globals/modals';

import { createEventListener } from '~/lib/hooks/event-listener';
import { on } from '~/lib/misc';

import { MAX_ORIGINAL_SIZE, SUPPORTED_IMAGE_TYPES } from '~/lib/bluemoji/compress';

import * as Boxed from '~/components/boxed';
import IconButton from '~/components/icon-button';
import AddOutlinedIcon from '~/components/icons-central/add-outline';
import * as Page from '~/components/page';
import * as Prompt from '~/components/prompt';
import AddEmotePrompt from '~/components/settings/bluemoji/add-emote-prompt';

const BluemojiEmotesPage = () => {
	const handleBlob = async (blob: Blob) => {
		const exifRemoved = removeExif(new Uint8Array(await blob.arrayBuffer()));
		if (exifRemoved !== null) {
			blob = new Blob([exifRemoved], { type: blob.type });
		}

		if (blob.size > MAX_ORIGINAL_SIZE) {
			openModal(() => (
				<Prompt.Confirm
					title="This image is too large"
					description="Images used for emotes cannot exceed more than 1 MB"
					confirmLabel="Okay"
					noCancel
				/>
			));

			return;
		}

		openModal(() => <AddEmotePrompt blob={blob} onAdd={() => {}} />);
	};

	return (
		<>
			<FileDnd onAdd={handleBlob} />

			<Page.Header>
				<Page.HeaderAccessory>
					<Page.Back to="/settings" />
				</Page.HeaderAccessory>

				<Page.Heading title="Emotes" />

				<Page.HeaderAccessory>
					<IconButton
						title="Upload emote"
						icon={AddOutlinedIcon}
						onClick={() => {
							const input = document.createElement('input');
							input.type = 'file';
							input.accept = SUPPORTED_IMAGE_TYPES.join(',');

							input.oninput = () => {
								const files = input.files;
								if (files && files.length !== 0) {
									handleBlob(files[0]);
								}
							};

							input.click();
						}}
					/>
				</Page.HeaderAccessory>
			</Page.Header>

			<Boxed.Container>
				<Boxed.Group>
					<Boxed.GroupBlurb>
						Here be dragons, this is an experimental feature, and things can change at any time. Animated
						emotes are not yet supported.
					</Boxed.GroupBlurb>
				</Boxed.Group>
			</Boxed.Container>
		</>
	);
};

export default BluemojiEmotesPage;

const FileDnd = ({ onAdd }: { onAdd: (blob: Blob) => void }) => {
	const [dropping, setDropping] = createSignal(false);

	createEffect(() => {
		if (hasModals()) {
			return;
		}

		let tracked: any;

		createEventListener(document, 'paste', (ev) => {
			const clipboardData = ev.clipboardData;
			if (!clipboardData) {
				return;
			}

			if (clipboardData.types.includes('Files')) {
				const files = Array.from(clipboardData.files).filter((file) =>
					SUPPORTED_IMAGE_TYPES.includes(file.type),
				);

				ev.preventDefault();

				if (files.length !== 0) {
					console.log(files);
					onAdd(files[0]);
				}
			}
		});

		createEventListener(document, 'drop', (ev) => {
			const dataTransfer = ev.dataTransfer;
			if (!dataTransfer) {
				return;
			}

			ev.preventDefault();
			setDropping(false);

			tracked = undefined;

			if (dataTransfer.types.includes('Files')) {
				const files = Array.from(dataTransfer.files).filter((file) =>
					SUPPORTED_IMAGE_TYPES.includes(file.type),
				);

				if (files.length !== 0) {
					console.log(files);
					onAdd(files[0]);
				}
			}
		});

		createEventListener(document, 'dragover', (ev) => {
			ev.preventDefault();
		});

		createEventListener(document, 'dragenter', (ev) => {
			setDropping(true);
			tracked = ev.target;
		});

		createEventListener(document, 'dragleave', (ev) => {
			if (tracked === ev.target) {
				setDropping(false);
				tracked = undefined;
			}
		});
	});

	return on(dropping, ($dropping) => {
		if (!$dropping) {
			return;
		}

		return (
			<div class="pointer-events-none fixed inset-0 z-[3] flex items-center justify-center bg-contrast-overlay/40">
				<div class="rounded-lg bg-background p-2">
					<p class="rounded border-2 border-dashed border-outline px-9 py-11">Drop to add emote</p>
				</div>
			</div>
		);
	}) as unknown as JSX.Element;
};
