import { createEffect, createRenderEffect } from 'solid-js';

import type { CreateMutationResult } from '@mary/solid-query';

type FocusableElement = HTMLButtonElement | HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
type TextInput = HTMLInputElement | HTMLTextAreaElement;

export const autofocusOnMutation = (
	node: FocusableElement,
	mutation: CreateMutationResult<any, any, any, any>,
	first = true,
) => {
	// Render effects are not affected by <Suspense>
	createRenderEffect((first: boolean) => {
		if (mutation.isError || first) {
			setTimeout(() => node.focus(), 0);
		}

		return false;
	}, first);
};

export const autofocusNode = (node: FocusableElement) => {
	setTimeout(() => node.focus(), 0);
};

export const autofocusIfEnabled = (node: FocusableElement, enabled: () => boolean) => {
	// Render effects are not affected by <Suspense>
	createRenderEffect(() => {
		if (enabled()) {
			setTimeout(() => node.focus(), 0);
		}
	});
};

export const modelText = (node: TextInput, getter: () => string, setter: (next: string) => void) => {
	let current: string | undefined;

	createEffect(() => {
		if (current !== (current = getter())) {
			node.value = current;
		}
	});

	node.addEventListener('input', (_ev) => {
		setter((current = node.value));
	});
};
