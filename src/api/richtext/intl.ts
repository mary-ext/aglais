const segmenter = new Intl.Segmenter();

export const textEncoder = new TextEncoder();
export const textDecoder = new TextDecoder();

export const graphemeLen = (text: string): number => {
	var length = asciiLen(text);

	if (length === undefined) {
		return _graphemeLen(text);
	}

	return length;
};

export const asciiLen = (str: string): number | undefined => {
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

const _graphemeLen = (text: string): number => {
	var iterator = segmenter.segment(text)[Symbol.iterator]();
	var count = 0;

	while (!iterator.next().done) {
		count++;
	}

	return count;
};
