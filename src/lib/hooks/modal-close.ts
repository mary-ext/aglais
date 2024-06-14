import { createEffect, onCleanup } from 'solid-js';

import { createEventListener } from './event-listener';

const isCloseWatcherAvailable = typeof CloseWatcher !== 'undefined';

export const useModalClose = (container: HTMLElement, callback: () => void, enabled: () => boolean) => {
	createEffect(() => {
		if (!enabled()) {
			return;
		}

		// Close modal if clicks happen outside of container
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

		// Start a close watcher if available, otherwise, listen to Escape key only
		if (isCloseWatcherAvailable) {
			const watcher = new CloseWatcher();
			watcher.oncancel = (ev) => {
				ev.preventDefault();
				close();
			};

			onCleanup(() => watcher.close());
		} else {
			createEventListener(window, 'keydown', (ev) => {
				if (ev.key === 'Escape' && !ev.defaultPrevented) {
					ev.preventDefault();

					const focused = document.activeElement;
					if (focused !== null && focused !== document.body) {
						(focused as any).blur();
					}

					callback();
				}
			});
		}
	});
};
