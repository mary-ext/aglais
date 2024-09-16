import type { Awaitable, SimpleStore } from '../types/store';

export interface GetCachedOptions {
	signal?: AbortSignal;
	noCache?: boolean;
	allowStale?: boolean;
}

export type Getter<K, V> = (
	key: K,
	options: undefined | GetCachedOptions,
	storedValue: undefined | V,
) => Awaitable<V>;

export interface CachedGetterOptions<K, V> {
	isStale?: (key: K, value: V) => boolean | PromiseLike<boolean>;
	lockKey?: (key: K) => string | undefined;
	onStoreError?: (err: unknown, key: K, value: V) => void | PromiseLike<void>;
	deleteOnError?: (err: unknown, key: K, value: V) => boolean | PromiseLike<boolean>;
}

type PendingItem<V> = Promise<{ value: V; isFresh: boolean }>;

const returnTrue = () => true;
const returnFalse = () => false;

export class CachedGetter<K extends string | number, V extends {} | null> {
	#pending = new Map<K, PendingItem<V>>();

	#getter: Getter<K, V>;
	#store: SimpleStore<K, V>;
	#options?: Readonly<CachedGetterOptions<K, V>>;

	constructor(getter: Getter<K, V>, store: SimpleStore<K, V>, options?: Readonly<CachedGetterOptions<K, V>>) {
		this.#getter = getter;
		this.#store = store;
		this.#options = options;
	}

	async get(key: K, options?: GetCachedOptions): Promise<V> {
		options?.signal?.throwIfAborted();

		const parentOptions = this.#options;
		const pending = this.#pending;

		const isStale = parentOptions?.isStale;

		const allowStored: (value: V) => Awaitable<boolean> = options?.noCache
			? returnFalse // Never allow stored values to be returned
			: options?.allowStale || isStale == null
				? returnTrue // Always allow stored values to be returned
				: async (value: V) => !(await isStale(key, value));

		// As long as concurrent requests are made for the same key, only one
		// request will be made to the cache & getter function at a time. This works
		// because there is no async operation between the while() loop and the
		// pending.set() call. Because of the "single threaded" nature of
		// JavaScript, the pending item will be set before the next iteration of the
		// while loop.
		let previousExecutionFlow: undefined | PendingItem<V>;
		while ((previousExecutionFlow = pending.get(key))) {
			try {
				const { isFresh, value } = await previousExecutionFlow;

				if (isFresh) return value;
				if (await allowStored(value)) return value;
			} catch {
				// Ignore errors from previous execution flows (they will have been
				// propagated by that flow).
			}

			options?.signal?.throwIfAborted();
		}

		const lockKey = parentOptions?.lockKey?.(key);
		const run = async (): PendingItem<V> => {
			const storedValue = await this.getStored(key);

			if (storedValue !== undefined && (await allowStored(storedValue))) {
				// Use the stored value as return value for the current execution
				// flow. Notify other concurrent execution flows (that should be
				// "stuck" in the loop before until this promise resolves) that we got
				// a value, but that it came from the store (isFresh = false).
				return { isFresh: false, value: storedValue };
			}

			return resolve((): Awaitable<V> => (0, this.#getter)(key, options, storedValue)).then(
				async (value): PendingItem<V> => {
					await this.setStored(key, value);
					return { isFresh: true, value };
				},
				async (err): Promise<never> => {
					const deleteOnError = parentOptions?.deleteOnError;

					if (deleteOnError && storedValue !== undefined) {
						try {
							if (await deleteOnError(err, key, storedValue)) {
								await this.deleteStored(key, err);
							}
						} catch (error) {
							throw new AggregateError([err, error], 'error while deleting stored value');
						}
					}

					throw err;
				},
			);
		};

		let promise: PendingItem<V>;

		if (lockKey !== undefined) {
			promise = navigator.locks.request(lockKey, run);
		} else {
			promise = run();
		}

		promise = promise.finally(() => pending.delete(key));

		if (pending.has(key)) {
			// This should never happen. Indeed, there must not be any 'await'
			// statement between this and the loop iteration check meaning that
			// this.pending.get returned undefined. It is there to catch bugs that
			// would occur in future changes to the code.
			throw new Error('concurrent request for the same key');
		}

		pending.set(key, promise);

		const { value } = await promise;
		return value;
	}

	async getStored(key: K): Promise<V | undefined> {
		try {
			return await this.#store.get(key);
		} catch (err) {
			return undefined;
		}
	}

	async setStored(key: K, value: V): Promise<void> {
		try {
			await this.#store.set(key, value);
		} catch (err) {
			const onStoreError = this.#options?.onStoreError;
			await onStoreError?.(err, key, value);
		}
	}

	async deleteStored(key: K, _cause?: unknown): Promise<void> {
		await this.#store.delete(key);
	}
}

const resolve = <T>(fn: () => T | Promise<T>): Promise<T> => {
	return new Promise((resolve) => resolve(fn()));
};
