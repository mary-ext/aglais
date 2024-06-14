const uniq = <T>(items: T[]): T[] => {
	return Array.from(new Set(items));
};

export const systemLanguages = uniq(navigator.languages.map((lang) => lang.split('-')[0]));

export const primarySystemLanguage = systemLanguages[0];
