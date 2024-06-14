import { createRenderEffect, createSignal, type Accessor, type Signal } from 'solid-js';

export const createDerivedSignal = <T>(accessor: Accessor<T>): Signal<T> => {
	const [state, setState] = createSignal<T>();

	createRenderEffect(() => {
		setState(accessor);
	});

	return [state, setState] as Signal<T>;
};
