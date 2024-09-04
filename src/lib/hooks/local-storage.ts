import { createEffect } from 'solid-js';
import { createMutable, modifyMutable, reconcile, type StoreNode } from 'solid-js/store';
import { createEventListener } from '../hooks/event-listener';

type MigrateFn<T> = (version: number, prev: any) => T;

/** Useful for knowing whether an effect occured by external writes */
export let isExternalWriting = false;

const parse = <T>(raw: string | null, migrate: MigrateFn<T>): T => {
	if (raw !== null) {
		try {
			const persisted = JSON.parse(raw);

			if (persisted != null) {
				return migrate(persisted.$version || 0, persisted);
			}
		} catch {}
	}

	return migrate(0, null);
};

export const createReactiveLocalStorage = <T extends StoreNode>(name: string, migrate: MigrateFn<T>) => {
	const mutable = createMutable<T>(parse(localStorage.getItem(name), migrate));

	createEffect((inited) => {
		const json = JSON.stringify(mutable);

		if (inited && !isExternalWriting) {
			localStorage.setItem(name, json);
		}

		return true;
	}, false);

	createEventListener(window, 'storage', (ev) => {
		if (ev.key === name) {
			// Prevent our own effects from running, since this is already persisted.

			try {
				isExternalWriting = true;
				modifyMutable(mutable, reconcile(parse(ev.newValue, migrate), { merge: true }));
			} finally {
				isExternalWriting = false;
			}
		}
	});

	return mutable;
};
