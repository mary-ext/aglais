import { createMemo, untrack } from 'solid-js';

import { replaceEqualDeep } from '@mary/solid-query';

const _on = <T, R>(accessor: () => T, callback: (value: T) => R): (() => R) => {
	return () => {
		const value = accessor();
		return untrack(() => callback(value));
	};
};

export const on = <T, R>(accessor: () => T, callback: (value: T) => R): (() => R) => {
	return createMemo(_on(accessor, callback));
};

type ReconcilableProperties<T> = { [K in keyof T]: T[K] extends string | number ? K : never }[keyof T];
export const reconcile = <T = any>(
	prev: NoInfer<T>[] | undefined,
	next: T[],
	key: ReconcilableProperties<T> | ((item: T) => string | number),
): T[] => {
	if (prev === undefined) {
		return next;
	}

	let equalItems = 0;

	const map = new Map<string | number, T>();
	const prevLen = prev.length;
	const nextLen = next.length;

	for (let idx = 0; idx < prevLen; idx++) {
		const item = prev[idx];

		// @ts-expect-error
		map.set(typeof key === 'function' ? key(item) : item[key], item);
	}

	const array: T[] = Array.from({ length: next.length });
	for (let idx = 0; idx < nextLen; idx++) {
		const nextItem = next[idx];
		// @ts-expect-error
		const prevItem = map.get(typeof key === 'function' ? key(nextItem) : nextItem[key]);

		if (prevItem !== undefined) {
			const replaced = replaceEqualDeep(prevItem, nextItem);
			if (replaced === prevItem) {
				equalItems++;
			}

			array[idx] = replaced;
		} else {
			array[idx] = nextItem;
		}
	}

	return equalItems === 0 ? next : array;
};

export const requestIdle = typeof requestIdleCallback === 'function' ? requestIdleCallback : setTimeout;

export const isSetEqual = <T>(a: Set<T>, b: Set<T>): boolean => {
	if (a.size !== b.size) {
		return false;
	}

	if (a.size !== 0) {
		for (const val of a) {
			if (!b.has(val)) {
				return false;
			}
		}
	}

	return true;
};

export const omit = <T extends Record<string, any>, K extends keyof T>(
	obj: T,
	keys: readonly K[],
): Omit<T, K> => {
	const result = { ...obj };

	for (let i = 0; i < keys.length; i++) {
		const key = keys[i];
		delete result[key];
	}

	return result as Omit<T, K>;
};
