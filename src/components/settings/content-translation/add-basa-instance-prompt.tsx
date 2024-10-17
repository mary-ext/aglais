import { createMemo, createSignal } from 'solid-js';

import { XRPC, simpleFetchHandler } from '@atcute/client';
import { createMutation } from '@mary/solid-query';

import { formatQueryError } from '~/api/utils/error';

import { useModalContext } from '~/globals/modals';

import { autofocusNode, modelText } from '~/lib/input-refs';
import { useSession } from '~/lib/states/session';
import { type Validation, validate } from '~/lib/validation';

import * as Prompt from '~/components/prompt';
import TextInput from '~/components/text-input';

const urlValidations: Validation<URL>[] = [
	[(url) => url.protocol === 'https:' || url.protocol === 'http:', `Has to be an HTTPS or HTTP URL`],
	[(url) => url.pathname === '/', `Can't have a pathname set`],
	[(url) => url.search.length <= 1, `Can't have a search string set`],
	[(url) => url.hash.length <= 1, `Can't have a hash string set`],
];

const AddBasaInstancePrompt = () => {
	const { close } = useModalContext();

	const { currentAccount } = useSession();
	const translationPrefs = currentAccount!.preferences.translation;

	const [error, setError] = createSignal<string>();

	const [url, setUrl] = createSignal('');

	const isUrlInvalid = createMemo(() => {
		const $url = url();
		if ($url.trim().length === 0) {
			return `Can't be empty`;
		}

		const parsed = URL.parse($url);
		if (!parsed) {
			return `Invalid URL`;
		}

		return validate(parsed, urlValidations);
	});

	const mutation = createMutation(() => ({
		async mutationFn({ url }: { url: URL }) {
			const rpc = new XRPC({ handler: simpleFetchHandler({ service: url }) });
			await rpc.get('x.basa.describeServer', {});
		},
		onSuccess(_data, { url }) {
			const href = url.toString();

			if (!translationPrefs.instances.includes(href)) {
				translationPrefs.instances.push(href);
			}

			close();
		},
		onError(error) {
			setError(formatQueryError(error));
		},
	}));

	return (
		<Prompt.Container disabled={mutation.isPending} maxWidth="md">
			<Prompt.Title>Add instance</Prompt.Title>

			<form
				class="contents"
				onSubmit={(ev) => {
					ev.preventDefault();
					mutation.mutate({ url: new URL(url()) });
				}}
			>
				<div class="mt-4 flex flex-col gap-4">
					<TextInput
						ref={(node) => {
							autofocusNode(node);
							modelText(node, url, setUrl);
						}}
						label="Instance URL"
						placeholder="https://example.com"
						error={url() && isUrlInvalid()}
					/>

					<p hidden={!error()} class="text-pretty text-de text-error">
						{error()}
					</p>
				</div>

				<Prompt.Actions>
					<Prompt.Action type="submit" disabled={!!isUrlInvalid()} noClose variant="primary">
						Add
					</Prompt.Action>
					<Prompt.Action>Cancel</Prompt.Action>
				</Prompt.Actions>
			</form>
		</Prompt.Container>
	);
};

export default AddBasaInstancePrompt;
