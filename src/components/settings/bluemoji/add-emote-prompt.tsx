import { createMemo, createSignal, onCleanup } from 'solid-js';

import { createMutation } from '@mary/solid-query';

import { uploadBlob } from '~/api/queries/blob';
import { graphemeLen } from '~/api/richtext/intl';
import { PLAIN_WS_RE } from '~/api/richtext/parser/parse';
import { formatQueryError } from '~/api/utils/error';
import { createRecord } from '~/api/utils/records';
import { getCurrentDate } from '~/api/utils/utils';

import { useModalContext } from '~/globals/modals';

import { autofocusNode, modelChecked, modelText } from '~/lib/input-refs';
import { useAgent } from '~/lib/states/agent';
import { useSession } from '~/lib/states/session';
import { validate, type Validation } from '~/lib/validation';

import { getCompressedEmotes } from '~/lib/bluemoji/compress';

import CheckboxInput from '../../checkbox-input';
import * as Prompt from '../../prompt';
import TextInput from '../../text-input';
import TextareaInput from '../../textarea-input';

export interface AddEmotePromptProps {
	blob: Blob;
	onAdd: () => void;
}

const VALID_NAME_RE = /^\s*[a-zA-Z0-9-_]+\s*$/;

const emoteNameValidations: Validation<string>[] = [
	[(val) => val.trim().length !== 0, `Can't be empty`],
	[(val) => val.length < 32, `Can't be more than 32 letters long`],
	[(val) => VALID_NAME_RE.test(val), `May only contain alphanumeric, dash and underscore`],
];

const altTextValidations: Validation<string>[] = [
	[(val) => graphemeLen(val) < 1_000, `Can't be more than 1,000 letters long`],
];

const AddEmotePrompt = ({ blob, onAdd }: AddEmotePromptProps) => {
	const { close } = useModalContext();

	const { rpc } = useAgent();
	const { currentAccount } = useSession();

	const blobUrl = URL.createObjectURL(blob);
	onCleanup(() => URL.revokeObjectURL(blobUrl));

	const [error, setError] = createSignal<string>();

	const [name, setName] = createSignal('');
	const [altText, setAltText] = createSignal('');
	const [cover, setCover] = createSignal(false);

	const [dimsEqual, setDimsEqual] = createSignal<boolean>();

	const isNameInvalid = createMemo(() => {
		return validate(name(), emoteNameValidations);
	});

	const isAltTextInvalid = createMemo(() => {
		return validate(altText(), altTextValidations);
	});

	const mutation = createMutation(() => ({
		async mutationFn() {
			const $name = name();
			const $altText = altText().replace(PLAIN_WS_RE, '');

			const { png_128, webp_128 } = await getCompressedEmotes(blob, cover() ? 'cover' : 'contain');

			const orig_prom = uploadBlob(rpc, blob);
			const png_prom = png_128 !== blob ? uploadBlob(rpc, png_128) : orig_prom;
			const webp_prom = webp_128 !== blob ? uploadBlob(rpc, webp_128) : orig_prom;

			const [orig_blob, png_blob, webp_blob] = await Promise.all([orig_prom, png_prom, webp_prom]);

			await createRecord(rpc, {
				repo: currentAccount!.did,
				collection: 'blue.moji.collection.item',
				rkey: $name,
				validate: false,
				record: {
					createdAt: getCurrentDate(),
					name: $name,
					alt: $altText,
					formats: {
						$type: 'blue.moji.collection.item#formats_v0',
						original: orig_blob,
						png_128: png_blob,
						webp_128: webp_blob,
					},
				},
			});
		},
		onMutate() {
			setError();
		},
		onSuccess() {
			close();
			onAdd();
		},
		onError(error) {
			setError(formatQueryError(error));
		},
	}));

	return (
		<Prompt.Container disabled={mutation.isPending} maxWidth="md">
			<Prompt.Title>Add emote</Prompt.Title>

			<div class="mt-4 flex flex-col gap-4">
				<div class="flex items-end gap-4">
					<img
						src={blobUrl}
						onLoad={(ev) => {
							setDimsEqual((prev) => {
								if (prev !== undefined) {
									return prev;
								}

								const image = ev.currentTarget;
								return image.naturalWidth === image.naturalHeight;
							});
						}}
						class={`h-24 w-24 rounded` + (cover() ? ` object-cover` : ` object-contain`)}
						style="background: repeating-conic-gradient(#c0c0c0 0% 25%, #fff 0% 50%) 50% / 20px 20px"
					/>

					{!dimsEqual() && (
						<CheckboxInput
							ref={(node) => {
								modelChecked(node, cover, setCover);
							}}
							label="Fit to crop"
						/>
					)}
				</div>

				<TextInput
					ref={(node) => {
						autofocusNode(node);
						modelText(node, name, setName);
					}}
					label="Name"
					placeholder="smile"
					error={name() && isNameInvalid()}
				/>

				<TextareaInput
					ref={(node) => {
						modelText(node, altText, setAltText);
					}}
					label="Alt text"
					minRows={3}
					maxRows={6}
				/>

				<p hidden={!error()} class="text-pretty text-de text-error">
					{error()}
				</p>
			</div>

			<Prompt.Actions>
				<Prompt.Action
					disabled={!!isNameInvalid() || !!isAltTextInvalid()}
					onClick={() => mutation.mutate()}
					noClose
					variant="primary"
				>
					Add
				</Prompt.Action>
				<Prompt.Action>Cancel</Prompt.Action>
			</Prompt.Actions>
		</Prompt.Container>
	);
};

export default AddEmotePrompt;
