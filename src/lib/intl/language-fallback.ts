const LANGUAGE_FALLBACKS: Record<string, string[] | undefined> = {
	he: ['iw'], // Hebrew
	id: ['in'], // Indonesian
};

export const expandLanguage = (code: string): string[] => {
	const entry = LANGUAGE_FALLBACKS[code];
	if (entry) {
		return entry.concat(code);
	}

	return [code];
};
