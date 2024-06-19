import { replaceEqualDeep } from '@mary/solid-query';
import { createMemo, untrack } from 'solid-js';

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

export const reconcile = <T extends { id: string | number }>(prev: T[] | undefined, next: T[]): T[] => {
	if (prev === undefined) {
		return next;
	}

	let equalItems = 0;

	const map = new Map<string | number, T>();
	for (let idx = 0, len = prev.length; idx < len; idx++) {
		const item = prev[idx];
		map.set(item.id, item);
	}

	const array: T[] = Array.from({ length: next.length });
	for (let idx = 0, len = next.length; idx < len; idx++) {
		const nextItem = next[idx];
		const prevItem = map.get(nextItem.id);

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

	return equalItems === prev.length ? prev : equalItems === 0 ? next : array;
};
