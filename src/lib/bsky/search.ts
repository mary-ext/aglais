// https://github.com/golang/go/blob/519f6a00e4dabb871eadaefc8ac295c09fd9b56f/src/strings/strings.go#L377-L425
export const fieldsfunc = (str: string, fn: (rune: number) => boolean): string[] => {
	const slices: string[] = [];

	let start = -1;
	for (let pos = 0, len = str.length; pos < len; pos++) {
		if (fn(str.charCodeAt(pos))) {
			if (start !== -1) {
				slices.push(str.slice(start, pos));
				start = -1;
			}
		} else {
			if (start === -1) {
				start = pos;
			}
		}
	}

	if (start !== -1) {
		slices.push(str.slice(start));
	}

	return slices;
};

export const tokenizeSearchQuery = (query: string): string[] => {
	// https://github.com/bluesky-social/indigo/blob/421e4da5307f4fcba51f25b5c5982c8b9841f7f6/search/parse_query.go#L15-L21
	let quoted = false;

	const tokens = fieldsfunc(query, (rune) => {
		if (rune === 34) {
			quoted = !quoted;
		}

		return rune === 32 && !quoted;
	});

	return tokens;
};
