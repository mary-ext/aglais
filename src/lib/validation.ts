export type Validation<T> = [(value: T) => boolean, message: string];

export const validate = <T>(value: T, validations: Validation<T>[]): false | string => {
	for (let idx = 0, len = validations.length; idx < len; idx++) {
		const validation = validations[idx];
		const result = (0, validation[0])(value);

		if (!result) {
			return validation[1];
		}
	}

	return false;
};
