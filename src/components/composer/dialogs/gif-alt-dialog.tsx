import { createMemo, createSignal } from 'solid-js';

import { graphemeLen } from '~/api/richtext/intl';
import { PLAIN_WS_RE } from '~/api/richtext/parser/parse';

import { useModalContext } from '~/globals/modals';

import { autofocusNode, modelText } from '~/lib/input-refs';

import Button from '../../button';
import * as Dialog from '../../dialog';
import Divider from '../../divider';
import TextareaInput, { CharCounter } from '../../textarea-input';

import type { GifMedia } from '../gifs/gif-search-dialog';

export interface GifAltDialogProps {
	gif: GifMedia;
	value: string | undefined;
	onChange: (next: string | undefined) => void;
}

const GifAltDialog = (props: GifAltDialogProps) => {
	const { close } = useModalContext();

	const [text, setText] = createSignal(props.value ?? '');

	const length = createMemo(() => graphemeLen(text()));
	const isEqual = () => text() === (props.value ?? '');

	return (
		<>
			<Dialog.Backdrop />
			<Dialog.Container fullHeight>
				<Dialog.Header>
					<Dialog.HeaderAccessory>
						<Dialog.Close />
					</Dialog.HeaderAccessory>

					<Dialog.Heading title="Edit GIF description" />

					<Dialog.HeaderAccessory>
						<Button
							disabled={isEqual() || length() > 1_000}
							onClick={() => {
								close();
								props.onChange(text().replace(PLAIN_WS_RE, '') || undefined);
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
						<div
							class="h-full w-full"
							style={`background: url(${props.gif.gifUrl}) center/contain no-repeat`}
						></div>
					</div>

					<Divider />

					<div class="shrink-0 p-4 pt-3">
						<TextareaInput
							ref={(node) => {
								autofocusNode(node);
								modelText(node, text, setText);
							}}
							label="Description"
							placeholder={props.gif.alt}
							minRows={2}
							maxRows={6}
							headerAccessory={<CharCounter value={length()} max={1_000} />}
						/>
					</div>
				</Dialog.Body>
			</Dialog.Container>
		</>
	);
};

export default GifAltDialog;
