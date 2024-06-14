export const clsx = (classes: (string | false | null | undefined | 0)[]): string => {
	var result = '';
	var subsequent = false;
	var temp: string | false | null | undefined | 0;

	for (var idx = 0, len = classes.length; idx < len; idx++) {
		if ((temp = classes[idx])) {
			subsequent && (result += ' ');
			result += temp;

			subsequent = true;
		}
	}

	return result;
};
