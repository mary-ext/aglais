const WS_TRIM_RE = /^\s+|\s+$| +(?=\n)|\n(?=(?: *\n){2}) */g;

export const trimRichText = (str: string) => {
	return str.replace(WS_TRIM_RE, '');
};
