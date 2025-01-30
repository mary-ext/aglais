import { createEffect, onCleanup } from 'solid-js';

import { intersectionCallback } from './observer';

export const ifIntersect = (
	node: HTMLElement,
	enabled: () => boolean | undefined,
	onIntersect: () => void,
	options?: IntersectionObserverInit,
) => {
	const observer = new IntersectionObserver(intersectionCallback, options);

	// @ts-expect-error
	node.$onintersect = (entry: IntersectionObserverEntry) => {
		if (entry.isIntersecting) {
			onIntersect();
		}
	};

	createEffect(() => {
		if (enabled()) {
			observer.observe(node);
			onCleanup(() => observer.disconnect());
		}
	});
};
