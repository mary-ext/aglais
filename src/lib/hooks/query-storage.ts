import type { Query, QueryFunctionContext, QueryKey } from '@mary/solid-query';

import { createEventListener } from '../hooks/event-listener';

export interface QueryPersistOptions {
	name: string;
	key?: string;
	maxAge?: number;
}

export const createQueryPersister = ({
	name,
	key = '',
	maxAge = 1000 * 60 * 60 * 24 * 7, // 7 days
}: QueryPersistOptions) => {
	let storage: QueryPersistenceSchema = {};

	const write = () => {
		localStorage.setItem(name, JSON.stringify(storage));
	};

	const read = (raw: string | null) => {
		storage = JSON.parse(raw ?? '{}') as any;

		let now = Date.now();
		let written = false;

		for (const queryHash in storage) {
			const persisted = storage[queryHash];
			const persistedKey = persisted.key;

			const age = now - persisted.dataUpdatedAt;

			const expired = age > maxAge;
			const mismatch = persistedKey !== key;

			if (expired || mismatch) {
				delete storage[queryHash];
				written = true;
			}
		}

		if (written) {
			write();
		}
	};

	const persist = async <T, TQueryKey extends QueryKey>(
		queryFn: (context: QueryFunctionContext<TQueryKey>) => T | Promise<T>,
		context: QueryFunctionContext<TQueryKey>,
		query: Query,
	) => {
		const hash = query.queryHash;

		{
			const persisted = storage[hash];

			if (persisted) {
				const persistedKey = persisted.key;
				const dataUpdatedAt = persisted.dataUpdatedAt;

				const age = Date.now() - dataUpdatedAt;

				const expired = age > maxAge;
				const mismatch = persistedKey !== key;

				if (expired || mismatch) {
					delete storage[hash];
					write();
				} else if (query.state.data === undefined || dataUpdatedAt > query.state.dataUpdatedAt) {
					// Just after restoring we want to get fresh data from the server if it's stale
					setTimeout(() => {
						// Set proper updatedAt, since resolving in the first pass overrides those values
						query.setState({ dataUpdatedAt: dataUpdatedAt });

						if (query.isStale()) {
							query.fetch();
						}
					}, 0);

					return persisted.data as T;
				}
			}
		}

		const result = await queryFn(context);

		{
			setTimeout(() => {
				const state = query.state;

				storage[hash] = {
					key: key,
					data: state.data,
					dataUpdatedAt: state.dataUpdatedAt,
				};

				write();
			}, 0);
		}

		return result;
	};

	read(localStorage.getItem(name));

	createEventListener(window, 'storage', (ev) => {
		if (ev.key === name) {
			read(ev.newValue);
		}
	});

	return persist;
};

interface QueryPersistenceSchema {
	[queryHash: string]: {
		key: string;
		data: unknown;
		dataUpdatedAt: number;
	};
}
