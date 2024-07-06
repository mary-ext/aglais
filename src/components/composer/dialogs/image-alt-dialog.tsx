import { createMemo, createSignal, onCleanup } from 'solid-js';

import { graphemeLen } from '~/api/richtext/intl';
import { PLAIN_WS_RE } from '~/api/richtext/parser/parse';

import { useModalContext } from '~/globals/modals';

import { autofocusNode, modelText } from '~/lib/input-refs';

import Button from '../../button';
import * as Dialog from '../../dialog';
import Divider from '../../divider';
import TextareaInput, { CharCounter } from '../../textarea-input';

export interface ImageAltDialogProps {
	image: Blob;
	value: string;
	onChange: (next: string) => void;
}

const ImageAltDialog = (props: ImageAltDialogProps) => {
	const { close } = useModalContext();

	const [text, setText] = createSignal(props.value);
	const normalizedText = createMemo(() => text().replace(PLAIN_WS_RE, ''));

	const length = createMemo(() => graphemeLen(normalizedText()));
	const isEqual = () => normalizedText() === props.value;

	const blobUrl = createMemo(() => {
		const blob = props.image;
		const url = URL.createObjectURL(blob);

		onCleanup(() => URL.revokeObjectURL(url));
		return url;
	});

	return (
		<>
			<Dialog.Backdrop />
			<Dialog.Container fullHeight>
				<Dialog.Header>
					<Dialog.HeaderAccessory>
						<Dialog.Close />
					</Dialog.HeaderAccessory>

					<Dialog.Heading title="Edit image description" />

					<Dialog.HeaderAccessory>
						<Button
							disabled={isEqual() || length() > 5_000}
							onClick={() => {
								close();
								props.onChange(normalizedText());
							}}
							variant="primary"
							size="sm"
						>
							Save
						</Button>
					</Dialog.HeaderAccessory>
				</Dialog.Header>

				<Dialog.Body unpadded class="flex flex-col">
					<div class="grow bg-contrast/sm-pressed p-4">
						<div class="h-full w-full" style={`background: url(${blobUrl()}) center/contain no-repeat`}></div>
					</div>

					<Divider />

					<div class="shrink-0 p-4 pt-3">
						<TextareaInput
							ref={(node) => {
								autofocusNode(node);
								modelText(node, text, setText);
							}}
							label="Description"
							minRows={2}
							maxRows={6}
							headerAccessory={<CharCounter value={length()} max={5_000} />}
						/>
					</div>
				</Dialog.Body>
			</Dialog.Container>
		</>
	);
};

export default ImageAltDialog;
