import { createMemo, createSignal, onCleanup } from 'solid-js';

export type GuardFunction = () => boolean;
type GuardKind = 'some' | 'every';

export const createGuard = (kind: GuardKind = 'some', memoize = false) => {
	const [guards, setGuards] = createSignal<GuardFunction[]>([]);

	const isGuarded = createMemoMaybe(memoize, createIsGuarded(kind, guards));

	const addGuard = (guard: GuardFunction) => {
		setGuards((guards) => guards.concat(guard));
		onCleanup(() => setGuards((guards) => guards.toSpliced(guards.indexOf(guard), 1)));
	};

	return [isGuarded, addGuard] as const;
};

const createIsGuarded = (kind: GuardKind, guards: () => GuardFunction[]) => {
	if (kind === 'every') {
		return () => {
			const $guards = guards();

			for (let idx = 0, len = $guards.length; idx < len; idx++) {
				const guard = $guards[idx];
				if (!guard()) {
					return false;
				}
			}

			return true;
		};
	} else if (kind === 'some') {
		return () => {
			const $guards = guards();

			for (let idx = 0, len = $guards.length; idx < len; idx++) {
				const guard = $guards[idx];
				if (guard()) {
					return true;
				}
			}

			return false;
		};
	}

	return () => false;
};

const createMemoMaybe = <T>(memoize: boolean, fn: () => T): (() => T) => {
	if (memoize) {
		return createMemo(fn);
	} else {
		return fn;
	}
};
