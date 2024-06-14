import { createEffect } from 'solid-js';

import { createEventListener } from './event-listener';

export const useOutsideClick = (container: HTMLElement, callback: () => void, enabled: () => boolean) => {
	createEffect(() => {
		if (!enabled()) {
			return;
		}

		let initialTarget: HTMLElement | null = null;

		createEventListener(document, 'pointerdown', (ev) => {
			// We'd like to know where the click initially started from, not where the
			// click ended up, this prevents closing the modal prematurely from the
			// user (accidentally) overshooting their mouse cursor.

			initialTarget = ev.target as HTMLElement | null;
		});

		createEventListener(
			document,
			'click',
			() => {
				// Don't do anything if `initialTarget` is somehow missing
				if (!initialTarget) {
					return;
				}

				// Unset `initialTarget` now that we're here
				const target = initialTarget;
				initialTarget = null;

				// Don't do anything if `target` is inside `container`
				if (container.contains(target)) {
					return;
				}

				// Call back since this click happened outside `container`.
				callback();
			},
			true,
		);
	});
};
