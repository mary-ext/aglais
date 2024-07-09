export async function toArray<T>(iterable: AsyncIterable<T>): Promise<T[]> {
	const array: T[] = [];

	for await (const value of iterable) {
		array.push(value);
	}

	return array;
}

export async function every<T>(
	iterable: AsyncIterable<T>,
	predicate: (value: T) => unknown,
): Promise<boolean> {
	for await (const value of iterable) {
		if (!predicate(value)) {
			return false;
		}
	}

	return true;
}

export async function some<T>(
	iterable: AsyncIterable<T>,
	predicate: (value: T) => unknown,
): Promise<boolean> {
	for await (const value of iterable) {
		if (predicate(value)) {
			return true;
		}
	}

	return false;
}

export function find<T, S extends T>(
	iterable: AsyncIterable<T>,
	predicate: (value: T) => value is S,
): Promise<S | undefined>;
export function find<T>(iterable: AsyncIterable<T>, predicate: (value: T) => unknown): Promise<T | undefined>;
export async function find<T>(
	iterable: AsyncIterable<T>,
	predicate: (value: T) => unknown,
): Promise<T | undefined> {
	for await (const value of iterable) {
		if (predicate(value)) {
			return value;
		}
	}
}

export function findLast<T, S extends T>(
	iterable: AsyncIterable<T>,
	predicate: (value: T) => value is S,
): Promise<S | undefined>;
export function findLast<T>(
	iterable: AsyncIterable<T>,
	predicate: (value: T) => unknown,
): Promise<T | undefined>;
export async function findLast<T>(
	iterable: AsyncIterable<T>,
	predicate: (value: T) => unknown,
): Promise<T | undefined> {
	let found: T | undefined;

	for await (const value of iterable) {
		if (predicate(value)) {
			found = value;
		}
	}

	return found;
}

export function filter<T, S extends T>(
	iterable: AsyncIterable<T>,
	predicate: (value: T) => value is S,
): AsyncGenerator<S>;
export function filter<T>(iterable: AsyncIterable<T>, predicate: (value: T) => unknown): AsyncGenerator<T>;
export async function* filter<T>(
	iterable: AsyncIterable<T>,
	predicate: (value: T) => unknown,
): AsyncGenerator<T> {
	for await (const value of iterable) {
		if (predicate(value)) {
			yield value;
		}
	}
}

export async function* map<T, S>(iterable: AsyncIterable<T>, mapper: (value: T) => S): AsyncGenerator<S> {
	for await (const value of iterable) {
		yield mapper(value);
	}
}

export async function* take<T>(iterable: AsyncIterable<T>, amount: number): AsyncGenerator<T> {
	let count = 0;

	for await (const value of iterable) {
		yield value;

		if (++count >= amount) {
			break;
		}
	}
}

export async function* skip<T>(iterable: AsyncIterable<T>, amount: number): AsyncGenerator<T> {
	let count = 0;

	for await (const value of iterable) {
		if (++count >= amount) {
			continue;
		}

		yield value;
	}
}
