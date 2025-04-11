export const assert: {
	(condition: any, message?: string): asserts condition;
} = (condition, message): asserts condition => {
	if (import.meta.env.DEV && !condition) {
		throw new Error(`Assertion failed` + (message ? `: ${message}` : ``));
	}
};

export const assertStrong: {
	(condition: any, message?: string): asserts condition;
} = (condition, message): asserts condition => {
	if (!condition) {
		if (import.meta.env.DEV) {
			throw new Error(`Assertion failed` + (message ? `: ${message}` : ``));
		}

		throw new Error(`Assertion failed`);
	}
};

export const assertUnreachable: {
	(_: never, message?: string): never;
} = (_, message) => {
	assertStrong(false, message);
};
