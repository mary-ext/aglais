import {
	createMemo,
	createSignal,
	untrack,
	type Accessor,
	type MemoOptions,
	type Setter,
	type SignalOptions,
} from 'solid-js';

// Solid's createSignal is pretty clunky to carry around as it returns an array
// that is expected to be destructured, this Signal class serves as a wrapper.

export interface Signal<T> {
	value: T;
	peek(): T;
}

export interface ReadonlySignal<T> extends Signal<T> {
	readonly value: T;
}

class SignalImpl<T> implements Signal<T> {
	#get: Accessor<T>;
	#set: Setter<T>;

	constructor(value: T, options?: SignalOptions<T>) {
		const impl = createSignal(value, options);
		this.#get = impl[0];
		this.#set = impl[1];
	}

	get value() {
		return this.#get();
	}

	set value(next: T) {
		// @ts-expect-error
		this.#set(typeof next === 'function' ? () => next : next);
	}

	peek() {
		return untrack(this.#get);
	}
}

class ComputedImpl<T> implements ReadonlySignal<T> {
	#get: Accessor<T>;

	constructor(compute: Accessor<T>, options?: MemoOptions<T>) {
		this.#get = createMemo(compute, options);
	}

	get value() {
		return this.#get();
	}

	peek() {
		return untrack(this.#get);
	}
}

export function signal<T>(): Signal<T | undefined>;
export function signal<T>(value: T, options?: SignalOptions<T>): Signal<T>;
export function signal(value?: any, options?: SignalOptions<any>): Signal<any> {
	return new SignalImpl(value, options);
}

export function computed<T>(compute: Accessor<T>, options?: MemoOptions<T>): ReadonlySignal<T> {
	return new ComputedImpl(compute, options);
}
