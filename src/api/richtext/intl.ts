var _graphemeLen: (text: string) => number;

export const textEncoder = new TextEncoder();
export const textDecoder = new TextDecoder();

export const graphemeLen = (text: string) => {
	var length = asciiLen(text);

	if (length === undefined) {
		return _graphemeLen(text);
	}

	return length;
};

export const asciiLen = (str: string) => {
	for (var idx = 0, len = str.length; idx < len; idx++) {
		const char = str.charCodeAt(idx);

		if (char > 127) {
			return undefined;
		}
	}

	return len;
};

export const getUtf8Length = (str: string): number => {
	return asciiLen(str) ?? textEncoder.encode(str).byteLength;
};

if (Intl.Segmenter) {
	var segmenter = new Intl.Segmenter();

	_graphemeLen = (text) => {
		var iterator = segmenter.segment(text)[Symbol.iterator]();
		var count = 0;

		while (!iterator.next().done) {
			count++;
		}

		return count;
	};
} else {
	console.log('Intl.Segmenter API not available, falling back to polyfill...');

	var { countGraphemes } = await import('./lib/unicode-segmenter.ts');
	_graphemeLen = countGraphemes;
}
