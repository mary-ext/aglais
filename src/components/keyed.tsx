import { createMemo, type JSX } from 'solid-js';
import { on } from '~/lib/utils/misc';

export interface KeyedProps<T> {
	value: T;
	children: (value: T) => JSX.Element;
}

const Keyed = <T,>(props: KeyedProps<T>) => {
	const memo = createMemo(() => props.value);
	return on(memo, props.children) as unknown as JSX.Element;
};

export default Keyed;
