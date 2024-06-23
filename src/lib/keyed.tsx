import {
	$TRACK,
	JSX,
	createMemo,
	createRoot,
	createSignal,
	onCleanup,
	untrack,
	type Accessor,
	type Setter,
	type SignalOptions,
} from 'solid-js';

const FALLBACK = Symbol('fallback');

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

	const signalOptions: SignalOptions<T> = { equals };

	const prev = new Map<K | typeof FALLBACK, Save>();
	onCleanup(() => dispose(prev.values()));

	return () => {
		const list = items() || [];
		(list as any)[$TRACK]; // top level store tracking

		return untrack(() => {
			// fast path for empty arrays
			if (!list.length) {
				dispose(prev.values());
				prev.clear();

				if (!fallback) {
					return [];
				}

				const fb = createRoot((dispose) => {
					prev.set(FALLBACK, { d: dispose } as Save);
					return fallback!();
				});

				return [fb];
			}

			const result = new Array<U>(list.length);

			// fast path for new create or after fallback
			const fb = prev.get(FALLBACK);
			if (!prev.size || fb) {
				fb?.d();
				prev.delete(FALLBACK);

				for (let i = 0; i < list.length; i++) {
					const item = list[i]!;
					const key = keyFn(item, i);
					addNewItem(result, item, i, key);
				}

				return result;
			}

			const prevKeys = new Set(prev.keys());

			for (let i = 0; i < list.length; i++) {
				const item = list[i]!;
				const key = keyFn(item, i);
				const lookup = prev.get(key);

				prevKeys.delete(key);

				if (lookup) {
					result[i] = lookup.r;

					// @ts-expect-error
					lookup.v(typeof item === 'function' ? () => item : item);
					lookup.i?.(i);
				} else {
					addNewItem(result, item, i, key);
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

			if (mapFn.length > 1) {
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
