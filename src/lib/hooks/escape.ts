import { createEffect } from 'solid-js';

import { createEventListener } from './event-listener';

export const useEscape = (callback: () => void, enabled: () => boolean) => {
	createEffect(() => {
		if (!enabled()) {
			return;
		}

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
	});
};
