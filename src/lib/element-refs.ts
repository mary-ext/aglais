import { createEffect } from 'solid-js';

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

	createEffect((setup: boolean) => {
		if (enabled()) {
			if (!setup) {
				observer.observe(node);
				return true;
			}
		} else {
			if (setup) {
				observer.unobserve(node);
				return false;
			}
		}

		return setup;
	}, false);
};
