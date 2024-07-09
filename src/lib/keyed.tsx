import {
	$TRACK,
	createMemo,
	createRoot,
	createSignal,
	onCleanup,
	untrack,
	type Accessor,
	type JSX,
	type Setter,
	type SignalOptions,
} from 'solid-js';

function dispose(list: Iterable<{ d: VoidFunction }>) {
	for (const o of list) o.d();
}

type EqualityFunction<T> = (prev: T, next: T) => boolean;

export function keyArray<T, U, K>(
	items: Accessor<readonly T[] | undefined | null | false>,
	keyFn: (item: T, index: number) => K,
	mapFn: (v: Accessor<T>, i: Accessor<number>) => U,
	{ fallback, equals }: { fallback?: Accessor<U>; equals?: EqualityFunction<T> | false } = {},
): Accessor<U[]> {
	type Save = {
		/** set value */
		v: Setter<T>;
		/** set index */
		i?: Setter<number>;
		/** return value */
		r: U;
		/** dispose function */
		d: () => void;
	};

	let fallbackDispose: (() => void) | undefined;

	const signalOptions: SignalOptions<T> = { equals };

	const hasIndex = mapFn.length > 1;
	const prev = new Map<K, Save>();
	onCleanup(() => dispose(prev.values()));

	return () => {
		const list = items() || [];
		(list as any)[$TRACK]; // top level store tracking

		return untrack(() => {
			const len = list.length;

			// Removal fast-path
			if (len === 0) {
				if (prev.size !== 0) {
					dispose(prev.values());
					prev.clear();
				}

				if (fallback !== undefined) {
					const fb = createRoot((dispose) => {
						fallbackDispose = dispose;
						return fallback!();
					});

					return [fb];
				}

				return [];
			}

			const result = new Array<U>(len);

			// Insertion fast-path
			if (prev.size === 0) {
				if (fallback !== undefined) {
					fallbackDispose!();
					fallbackDispose = undefined;
				}

				for (let idx = 0; idx < len; idx++) {
					const item = list[idx]!;
					const key = keyFn(item, idx);
					addNewItem(result, item, idx, key);
				}

				return result;
			}

			const prevKeys = new Set(prev.keys());

			for (let idx = 0; idx < len; idx++) {
				const item = list[idx]!;
				const key = keyFn(item, idx);
				const lookup = prev.get(key);

				prevKeys.delete(key);

				if (lookup) {
					result[idx] = lookup.r;

					// @ts-expect-error
					lookup.v(typeof item === 'function' ? () => item : item);

					if (hasIndex) {
						lookup.i!(idx);
					}
				} else {
					addNewItem(result, item, idx, key);
				}
			}

			for (const key of prevKeys) {
				prev.get(key)?.d();
				prev.delete(key);
			}

			return result;
		});
	};

	function addNewItem(list: U[], item: T, i: number, key: K): void {
		createRoot((dispose) => {
			const [getItem, setItem] = createSignal(item, signalOptions);
			const save = { v: setItem, d: dispose } as Save;

			if (hasIndex) {
				const [index, setIndex] = createSignal(i);
				save.i = setIndex;
				save.r = mapFn(getItem, index);
			} else {
				save.r = (mapFn as any)(getItem);
			}

			prev.set(key, save);
			list[i] = save.r;
		});
	}
}

export function Key<T>(props: {
	each?: readonly T[] | null | false;
	by: (v: T) => any;
	fallback?: JSX.Element;
	equals?: EqualityFunction<T> | false;
	children: (v: Accessor<T>, i: Accessor<number>) => JSX.Element;
}): JSX.Element {
	return createMemo(
		keyArray<T, JSX.Element, any>(() => props.each, props.by, props.children, {
			fallback: 'fallback' in props ? () => props.fallback : undefined,
			equals: props.equals,
		}),
	) as unknown as JSX.Element;
}
