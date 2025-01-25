import { type JSX, createContext, createSignal, useContext } from 'solid-js';

import { assert } from '~/lib/utils/invariant';

interface SearchBarContext {
	inputEl: () => HTMLInputElement | null;
	setInputEl: (next: HTMLInputElement) => void;

	query: () => string;
	setQuery: (next: string) => void;

	onSearch: (next: string) => void;
	onFocus: () => void;
}

const Context = createContext<SearchBarContext>();

export interface SearchBarProviderProps {
	query: string;
	onFocus?: () => void;
	onQueryChange: (next: string) => void;
	onSearch: (next: string) => void;
	children: JSX.Element;
}

export const SearchBarProvider = (props: SearchBarProviderProps) => {
	const [inputEl, setInputEl] = createSignal<HTMLInputElement | null>(null);

	const context: SearchBarContext = {
		inputEl,
		setInputEl,

		query() {
			return props.query;
		},
		setQuery: props.onQueryChange,

		onSearch: props.onSearch,
		onFocus: props.onFocus ?? (() => {}),
	};

	return <Context.Provider value={context}>{props.children}</Context.Provider>;
};

export const useSearchBar = () => {
	const context = useContext(Context);
	assert(context !== undefined, `Expected useSearch to be called under <SearchProvider>`);

	return context;
};
