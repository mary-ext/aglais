export interface GlobalPreferenceSchema {
	$version: 1;
	ui: UiPreferences;
}

export interface UiPreferences {
	theme: 'system' | 'light' | 'dark';
}
