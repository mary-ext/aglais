import { type ParentProps, createContext, getOwner, runWithOwner, useContext } from 'solid-js';

import { assert } from '../utils/invariant';

export interface SingletonContext {
	inject<T>(construct: () => T): T;
}

const Context = createContext<SingletonContext>();

export const SingletonProvider = (props: ParentProps) => {
	const owner = getOwner();
	const instances = new Map<() => any, any>();

	const context: SingletonContext = {
		inject(construct) {
			let instance = instances.get(construct);
			if (instance === undefined) {
				instances.set(construct, (instance = runWithOwner(owner, construct)));
			}

			return instance;
		},
	};

	return <Context.Provider value={context}>{props.children}</Context.Provider>;
};

export const inject = <T,>(construct: () => T): T => {
	const context = useContext(Context);
	assert(context !== undefined, `Expected inject to be called under <SingletonProvider>`);

	return context.inject(construct);
};
