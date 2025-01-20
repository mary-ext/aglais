export const min = (a: Date, b: Date): Date => {
	return a.getTime() < b.getTime() ? a : b;
};

export const max = (a: Date, b: Date): Date => {
	return a.getTime() > b.getTime() ? a : b;
};

export const clamp = (date: Date, min: Date | undefined, max: Date | undefined): Date => {
	if (min !== undefined && date.getTime() < min.getTime()) {
		return min;
	}

	if (max !== undefined && date.getTime() > max.getTime()) {
		return max;
	}

	return date;
};

export const cloneDate = (date: Date | number) => {
	return new Date(date);
};

export const startOfWeek = (date: Date): Date => {
	const d = cloneDate(date);
	const diff = d.getDate() - d.getDay();

	d.setDate(diff);
	d.setHours(0, 0, 0, 0);
	return d;
};

export const endOfWeek = (date: Date): Date => {
	const d = cloneDate(date);
	const diff = 6 - d.getDay();

	d.setDate(d.getDate() + diff);
	d.setHours(23, 59, 59, 999);
	return d;
};

export const startOfMonth = (date: Date): Date => {
	const d = cloneDate(date);

	d.setDate(1);
	d.setHours(0, 0, 0, 0);
	return d;
};

export const endOfMonth = (date: Date): Date => {
	const d = cloneDate(date);

	d.setMonth(d.getMonth() + 1);
	d.setDate(0);
	d.setHours(23, 59, 59, 999);
	return d;
};

export const addDays = (date: Date, days: number): Date => {
	const d = cloneDate(date);

	d.setDate(d.getDate() + days);
	return d;
};

export const addMonths = (date: Date, months: number): Date => {
	const d = cloneDate(date);

	d.setMonth(d.getMonth() + months);
	return d;
};

export const isBefore = (date: Date, dateToCompare: Date): boolean => {
	return date.getTime() < dateToCompare.getTime();
};

export const isSameYear = (a: Date, b: Date): boolean => {
	return a.getFullYear() === b.getFullYear();
};

export const isSameMonth = (a: Date, b: Date): boolean => {
	return a.getMonth() === b.getMonth() && isSameYear(a, b);
};

export const isSameDate = (a: Date, b: Date): boolean => {
	return a.getDate() === b.getDate() && isSameMonth(a, b);
};

export const getDate = (date: Date): number => {
	return date.getDate();
};
