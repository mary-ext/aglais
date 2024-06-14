import { createContext, createRenderEffect, createSignal, useContext, type ParentProps } from 'solid-js';

import * as preferences from '~/globals/preferences';

import { useMediaQuery } from '../hooks/media-query';
import { assert } from '../invariant';

type Theme = 'light' | 'dark';

export interface ThemeContext {
	readonly currentTheme: Theme;
}

const Context = createContext<ThemeContext>();

export const useTheme = (): ThemeContext => {
	const context = useContext(Context);
	assert(context !== undefined, `Expected useTheme to be used under ThemeProvider`);

	return context;
};

export const ThemeProvider = (props: ParentProps) => {
	const [theme, setTheme] = createSignal<Theme>('light');

	const context: ThemeContext = {
		get currentTheme() {
			return theme();
		},
	};

	createRenderEffect(() => {
		const theme = preferences.global.ui.theme;

		if (theme === 'system') {
			const isDark = useMediaQuery('(prefers-color-scheme: dark)');
			createRenderEffect(() => setTheme(!isDark() ? 'light' : 'dark'));
		} else {
			setTheme(theme);
		}
	});

	createRenderEffect(() => {
		const cl = document.documentElement.classList;
		const $theme = theme();

		cl.toggle('theme-light', $theme === 'light');
		cl.toggle('theme-dark', $theme === 'dark');
	});

	return <Context.Provider value={context}>{props.children}</Context.Provider>;
};
