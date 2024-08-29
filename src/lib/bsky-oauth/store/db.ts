import { openDB, type IDBPDatabase } from 'idb';

import type { At } from '@atcute/client/lexicons';
import type { DidDocument } from '@atcute/client/utils/did';

import type { DPoPKey } from '../types/dpop';
import type { AuthorizationServerMetadata, ProtectedResourceMetadata } from '../types/server';
import type { SimpleStore } from '../types/store';
import type { TokenSet } from '../types/token';

export interface OAuthDatabaseOptions {
	name: string;
}

interface SchemaItem<T> {
	value: T;
	expiresAt: number | null;
}

interface Schema {
	states: {
		key: string;
		value: {
			dpopKey: DPoPKey;
			issuer: string;
			verifier?: string;
		};
	};
	sessions: {
		key: At.DID;
		value: {
			dpopKey: DPoPKey;
			tokenSet: TokenSet;
		};
		indexes: {
			expiresAt: number;
		};
	};
	dpopNonces: {
		key: string;
		value: string;
	};

	handles: {
		key: string;
		value: At.DID;
	};
	didDocuments: {
		key: At.DID;
		value: DidDocument;
	};

	authorizationServerMetadata: {
		key: string;
		value: AuthorizationServerMetadata;
	};
	protectedServerMetadata: {
		key: string;
		value: ProtectedResourceMetadata;
	};
}

const schemaStores = [
	'states',
	'sessions',
	'dpopNonces',
	'handles',
	'didDocuments',
	'authorizationServerMetadata',
	'protectedServerMetadata',
];

const migrations: Array<(db: IDBPDatabase<any>) => void | Promise<void>> = [
	(db) => {
		for (const name of schemaStores) {
			const store = db.createObjectStore(name);
			store.createIndex('expiresAt', 'expiresAt', { unique: false });
		}
	},
];

export const createOAuthDatabase = ({ name }: OAuthDatabaseOptions) => {
	const dbPromise = openDB(name, migrations.length, {
		async upgrade(db, prev, next) {
			for (let version = prev; version < (next ?? migrations.length); ++version) {
				const migration = migrations[version];
				await migration(db);
			}
		},
	});

	const interval = setInterval(async () => {
		const db = await dbPromise;
		const range = IDBKeyRange.upperBound(Date.now());

		for (const name of schemaStores) {
			const tx = db.transaction(name, 'readwrite', { durability: 'relaxed' });

			const store = tx.objectStore(name);
			const index = store.index('expiresAt');

			const keys = await index.getAllKeys(range);

			await Promise.all(keys.map((key) => store.delete(key)));
		}
	}, 30e3);

	const createStore = <N extends keyof Schema>(
		name: N,
		{ expiresAt }: { expiresAt: (item: Schema[N]['value']) => null | number },
	): SimpleStore<Schema[N]['key'], Schema[N]['value']> => {
		return {
			async get(key) {
				const db = await dbPromise;

				const tx = db.transaction(name, 'readwrite', { durability: 'relaxed' });
				const store = tx.objectStore(name);

				const item: SchemaItem<Schema[N]['value']> = await store.get(key);

				const expiresAt = item.expiresAt;
				if (expiresAt !== null && Date.now() > expiresAt) {
					await store.delete(key);
					await tx.done;
					return;
				}

				return item.value;
			},
			async set(key, value) {
				const item: SchemaItem<Schema[N]['value']> = {
					expiresAt: expiresAt(value),
					value: value,
				};

				const db = await dbPromise;

				const tx = db.transaction(name, 'readwrite', { durability: 'strict' });
				const store = tx.objectStore(name);

				await store.put(item, key);

				await tx.done;
			},
			async delete(key) {
				const db = await dbPromise;

				const tx = db.transaction(name, 'readwrite', { durability: 'strict' });
				const store = tx.objectStore(name);

				await store.delete(key);

				await tx.done;
			},
		};
	};

	const TEN_MINUTES = () => Date.now() + 10 * 60e3;

	return {
		[Symbol.asyncDispose]() {
			return this.dispose();
		},

		async dispose() {
			clearInterval(interval);

			const db = await dbPromise;
			db.close();
		},

		states: createStore('states', {
			expiresAt: TEN_MINUTES,
		}),
		sessions: createStore('sessions', {
			expiresAt: ({ tokenSet }) => {
				if (tokenSet.refresh_token) {
					return null;
				}

				return tokenSet.expires_at ?? null;
			},
		}),
		dpopNonces: createStore('dpopNonces', {
			expiresAt: (_item) => Date.now() + 600e3,
		}),

		handles: createStore('handles', {
			expiresAt: TEN_MINUTES,
		}),
		didDocuments: createStore('didDocuments', {
			expiresAt: TEN_MINUTES,
		}),

		authorizationServerMetadata: createStore('authorizationServerMetadata', {
			expiresAt: TEN_MINUTES,
		}),
		protectedServerMetadata: createStore('protectedServerMetadata', {
			expiresAt: TEN_MINUTES,
		}),
	};
};
