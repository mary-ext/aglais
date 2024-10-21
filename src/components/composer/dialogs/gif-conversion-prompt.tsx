import { wrap } from 'comlink';
import { Match, Switch, createResource } from 'solid-js';

import { useModalContext } from '~/globals/modals';

import { makeAbortable } from '~/lib/hooks/abortable';

import CircularProgressView from '~/components/circular-progress-view';
import * as Prompt from '~/components/prompt';

import type { GifWorkerApi } from '../workers/gif-conversion';

export interface GifConversionPromptProps {
	blob: Blob;
	onSuccess: (video: Blob) => void;
}

const GifConversionPrompt = ({ blob, onSuccess }: GifConversionPromptProps) => {
	const { close } = useModalContext();

	const [getAbortSignal] = makeAbortable();
	const [resource] = createResource(async () => {
		const signal = getAbortSignal();

		let video: Blob;
		{
			const worker = new Worker(new URL('../workers/gif-conversion', import.meta.url), { type: 'module' });

			try {
				const api = wrap<GifWorkerApi>(worker);
				video = await api.transform(blob);
			} finally {
				worker.terminate();
			}
		}

		signal.throwIfAborted();

		close();
		onSuccess(video);
	});

	return (
		<Prompt.Container>
			<Switch>
				<Match when={resource.error}>
					{(err) => (
						<>
							<Prompt.Title>Failed to convert GIF</Prompt.Title>
							<p class="text-pretty text-de text-error">{'' + err()}</p>

							<Prompt.Actions>
								<Prompt.Action variant="primary">Close</Prompt.Action>
							</Prompt.Actions>
						</>
					)}
				</Match>

				<Match when>
					<Prompt.Title>Converting GIF</Prompt.Title>
					<Prompt.Description>This might take a bit</Prompt.Description>

					<div class="mt-6">
						<CircularProgressView />
					</div>

					<Prompt.Actions>
						<Prompt.Action>Cancel</Prompt.Action>
					</Prompt.Actions>
				</Match>
			</Switch>
		</Prompt.Container>
	);
};

export default GifConversionPrompt;
