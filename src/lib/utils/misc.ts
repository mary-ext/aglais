import { createMemo, untrack } from 'solid-js';

import { replaceEqualDeep } from '@mary/solid-query';

export const mapDefined = <T, R>(array: T[], mapper: (value: T) => R | undefined): R[] => {
	var mapped: R[] = [];

	var idx = 0;
	var len = array.length;
	var temp: R | undefined;

	for (; idx < len; idx++) {
		if ((temp = mapper(array[idx])) !== undefined) {
			mapped.push(temp);
		}
	}

	return mapped;
};

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

export const uniq = <T>(items: T[]): T[] => {
	return Array.from(new Set(items));
};

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
