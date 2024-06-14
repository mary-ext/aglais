import { createRoot } from 'solid-js';

import type { GlobalPreferenceSchema } from '~/lib/preferences/global';
import type { SessionPreferenceSchema } from '~/lib/preferences/sessions';

import { createReactiveLocalStorage } from '~/lib/signals/storage';

export const sessions = createRoot(() => {
	return createReactiveLocalStorage<SessionPreferenceSchema>('sessions', (version, prev) => {
		if (version === 0) {
			return {
				$version: 1,
				active: undefined,
				accounts: [],
			};
		}

		return prev;
	});
});

export const global = createRoot(() => {
	return createReactiveLocalStorage<GlobalPreferenceSchema>('global', (version, prev) => {
		if (version === 0) {
			const prefs: GlobalPreferenceSchema = {
				$version: 1,
				ui: {
					theme: 'system',
				},
			};

			return prefs;
		}

		return prev;
	});
});
