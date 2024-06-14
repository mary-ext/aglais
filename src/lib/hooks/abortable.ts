import { onCleanup } from 'solid-js';

type Abortable = [signal: () => AbortSignal, cleanup: () => void];

export const makeAbortable = (): Abortable => {
	let controller: AbortController | undefined;

	const cleanup = () => {
		return controller?.abort();
	};

	const signal = () => {
		cleanup();

		controller = new AbortController();
		return controller.signal;
	};

	onCleanup(cleanup);

	return [signal, cleanup];
};
