export const RECORD_KEY_RE = /(?!\.{1,2}$)[a-zA-Z0-9_~.:-]{1,512}/;

export const isRecordKey = (input: string) => {
	return input.length >= 1 && input.length <= 512 && RECORD_KEY_RE.test(input);
};

export const TID_RE = /^[234567abcdefghij][234567abcdefghijklmnopqrstuvwxyz]{12}$/;

export const isTid = (input: string) => {
	return input.length === 13 && TID_RE.test(input);
};
