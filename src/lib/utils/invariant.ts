export function assert(condition: any, message?: string): asserts condition {
	if (import.meta.env.DEV && !condition) {
		throw new Error(`Assertion failed` + (message ? `: ${message}` : ``));
	}
}

export function assertStrong(condition: any, message?: string): asserts condition {
	if (!condition) {
		if (import.meta.env.DEV) {
			throw new Error(`Assertion failed` + (message ? `: ${message}` : ``));
		}

		throw new Error(`Assertion failed`);
	}
}
