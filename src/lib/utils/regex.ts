const ESCAPE_RE = /[/\-\\^$*+?.()|[\]{}]/g;

export const escapeRegex = (str: string) => {
	return str.replace(ESCAPE_RE, '\\$&');
};
