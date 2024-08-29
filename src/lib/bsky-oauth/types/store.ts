export interface SimpleStore<K extends string | number, V extends {} | null> {
	/**
	 * @return undefined if the key is not in the store (which is why Value cannot contain "undefined").
	 */
	get: (key: K) => Promise<undefined | V>;
	set: (key: K, value: V) => Promise<void>;
	delete: (key: K) => Promise<void>;
}

export type Awaitable<T> = T | Promise<T>;
