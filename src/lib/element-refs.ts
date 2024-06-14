import { createEffect } from 'solid-js';

import { intersectionObserver } from './observer';

export const ifIntersect = (
	node: HTMLElement,
	enabled: () => boolean | undefined,
	onIntersect: () => void,
) => {
	createEffect((setup: boolean) => {
		if (enabled()) {
			if (!setup) {
				// @ts-expect-error
				node.$onintersect = (entry: IntersectionObserverEntry) => {
					if (entry.isIntersecting) {
						onIntersect();
					}
				};

				intersectionObserver.observe(node);
				return true;
			}
		} else {
			if (setup) {
				// @ts-expect-error
				node.$onintersect = undefined;

				intersectionObserver.unobserve(node);
				return false;
			}
		}

		return setup;
	}, false);
};
