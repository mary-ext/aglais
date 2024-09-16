import { createRoot, onCleanup } from 'solid-js';

import type { At } from '@atcute/client/lexicons';

import { createEventListener } from '~/lib/hooks/event-listener';

import type { DPoPKey } from '../types/dpop';
import type { SimpleStore } from '../types/store';
import type { Session } from '../types/token';
import { locks } from '../utils';

export interface OAuthDatabaseOptions {
	name: string;
}

interface SchemaItem<T> {
	value: T;
	expiresAt: number | null;
}

interface Schema {
	sessions: {
		key: At.DID;
		value: Session;
		indexes: {
			expiresAt: number;
		};
	};
	states: {
		key: string;
		value: {
			dpopKey: DPoPKey;
			issuer: string;
			verifier?: string;
		};
	};

	dpopNonces: {
		key: string;
		value: string;
	};
}

const parse = (raw: string | null) => {
	if (raw != null) {
		const parsed = JSON.parse(raw);
		if (parsed != null) {
			return parsed;
		}
	}

	return {};
};

export const createOAuthDatabase = ({ name }: OAuthDatabaseOptions) => {
	return createRoot((dispose) => {
		let disposed = false;
		onCleanup(() => (disposed = true));

		// "Thread-safe" localStorage
		const createStore = <N extends keyof Schema>(
			subname: N,
			{ expiresAt }: { expiresAt: (item: Schema[N]['value']) => null | number },
		): SimpleStore<Schema[N]['key'], Schema[N]['value']> => {
			const storageKey = `${name}-${subname}`;

			const persist = () => store && localStorage.setItem(storageKey, JSON.stringify(store));
			const read = () => (store ??= parse(localStorage.getItem(storageKey)));

			let store: any;

			createEventListener(window, 'storage', (ev) => {
				if (ev.key === storageKey) {
					store = undefined;
				}
			});

			locks.request(`${storageKey}-cleanup`, { ifAvailable: true }, async (lock) => {
				if (!lock) {
					return;
				}

				await new Promise((resolve) => setTimeout(resolve, 10_000));

				if (disposed) {
					return;
				}

				let now = Date.now();
				let changed = false;

				read();

				for (const key in store) {
					const item = store[key];
					const expiresAt = item.expiresAt;

					if (expiresAt !== null && now > expiresAt) {
						changed = true;
						delete store[key];
					}
				}

				if (changed) {
					persist();
				}
			});

			return {
				async get(key) {
					if (disposed) {
						throw new Error(`store closed`);
					}

					read();

					const item: SchemaItem<Schema[N]['value']> = store[key];
					if (!item) {
						return;
					}

					const expiresAt = item.expiresAt;
					if (expiresAt !== null && Date.now() > expiresAt) {
						delete store[key];
						persist();

						return;
					}

					return item.value;
				},
				async set(key, value) {
					if (disposed) {
						throw new Error(`store closed`);
					}

					read();

					const item: SchemaItem<Schema[N]['value']> = {
						expiresAt: expiresAt(value),
						value: value,
					};

					store[key] = item;
					persist();
				},
				async delete(key) {
					if (disposed) {
						throw new Error(`store closed`);
					}

					read();

					if (store[key] !== undefined) {
						delete store[key];
						persist();
					}
				},
			};
		};

		return {
			dispose: dispose,

			sessions: createStore('sessions', {
				expiresAt: ({ token }) => {
					if (token.refresh) {
						return null;
					}

					return token.expires_at ?? null;
				},
			}),
			states: createStore('states', {
				expiresAt: (_item) => Date.now() + 10 * 60 * 1_000,
			}),
			dpopNonces: createStore('dpopNonces', {
				expiresAt: (_item) => Date.now() + 10 * 60 * 1_000,
			}),
		};
	});
};
