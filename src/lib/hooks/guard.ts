import { createMemo, createSignal, onCleanup } from 'solid-js';

export type GuardFunction = () => boolean;

export const createGuard = (memoize = false) => {
	const [guards, setGuards] = createSignal<GuardFunction[]>([]);

	const isGuarded = createMemoMaybe(memoize, () => {
		const $guards = guards();
		for (let idx = 0, len = $guards.length; idx < len; idx++) {
			const guard = $guards[idx];
			if (guard()) {
				return true;
			}
		}

		return false;
	});

	const addGuard = (guard: GuardFunction) => {
		setGuards((guards) => guards.concat(guard));
		onCleanup(() => setGuards((guards) => guards.toSpliced(guards.indexOf(guard), 1)));
	};

	return [isGuarded, addGuard] as const;
};

const createMemoMaybe = <T>(memoize: boolean, fn: () => T): (() => T) => {
	if (memoize) {
		return createMemo(fn);
	} else {
		return fn;
	}
};
