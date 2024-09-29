// TinySimpleHash, public domain
// https://stackoverflow.com/a/52171480
export const tinyhash = (str: string): number => {
	for (var i = str.length, h = 9; i; ) {
		h = Math.imul(h ^ str.charCodeAt(--i), 9 ** 9);
	}

	return h ^ (h >>> 9);
};
