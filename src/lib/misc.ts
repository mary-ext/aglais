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

export const on = <T, R>(accessor: () => T, callback: (value: T) => R): (() => R) => {
	return () => {
		const value = accessor();
		return untrack(() => callback(value));
	};
};

export const memoizedOn = <T, R>(accessor: () => T, callback: (value: T) => R): (() => R) => {
	return createMemo(on(accessor, callback));
};
