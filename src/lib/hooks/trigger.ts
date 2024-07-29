import { createSignal } from 'solid-js';

export const createTrigger = () => {
	return createSignal<void>(undefined, { equals: false });
};
