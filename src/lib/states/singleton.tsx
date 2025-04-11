import { type ParentProps, createContext, createRoot, getOwner, useContext } from 'solid-js';

import { assert } from '../utils/invariant';

interface Singleton<T> {
	n: string;
	c: () => T;
}

interface SingletonContext {
	inject<T>(singleton: Singleton<T>): T;
}

const Context = createContext<SingletonContext>();

export const SingletonProvider = (props: ParentProps) => {
	const owner = getOwner();
	const registry = new Map<
		string,
		{
			construct: any;
			value: any;
			cleanup: () => void;
		}
	>();

	const context: SingletonContext = {
		inject({ n: name, c: construct }) {
			let registered = registry.get(name);
			if (registered === undefined || registered.construct !== construct) {
				registered?.cleanup();
				registered = createRoot((cleanup) => ({ construct, cleanup, value: construct() }), owner);

				registry.set(name, registered);
			}

			return registered.value;
		},
	};

	return <Context.Provider value={context}>{props.children}</Context.Provider>;
};

export const define = <T,>(name: string, construct: () => T): Singleton<T> => {
	return { n: name, c: construct };
};

export const inject = <T,>(singleton: Singleton<T>): T => {
	const context = useContext(Context);
	assert(context !== undefined, `Expected inject to be called under <SingletonProvider>`);

	return context.inject(singleton);
};
