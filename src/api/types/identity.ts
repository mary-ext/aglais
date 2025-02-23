export type Handle = `${string}.${string}`;

export const HANDLE_RE =
	/^(?=.{4,253}$)(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+([a-zA-Z][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])$/;

export const isHandle = (input: string): input is Handle => {
	return input.length >= 3 && input.length <= 253 && HANDLE_RE.test(input);
};

export type Did<TMethod extends string = string> = `did:${TMethod}:${string}`;
export type AtprotoDid = Did<'plc' | 'web'>;

export const DID_RE = /^(?=.{7,2048}$)did:([a-z]+):([a-zA-Z0-9._:%\-]*[a-zA-Z0-9._\-])$/;

export const isDid = (input: string): input is Did => {
	return input.length >= 7 && input.length <= 2048 && DID_RE.test(input);
};

export const ATPROTO_WEB_DID_RE =
	/^did:web:([a-zA-Z0-9\-]+(?:\.[a-zA-Z0-9\-]+)*(?:\.[a-zA-Z]{2,})|localhost(?:%3[aA]\d+)?)$/;

export const isAtprotoWebDid = (input: string): input is Did<'web'> => {
	return input.length >= 12 && ATPROTO_WEB_DID_RE.test(input);
};

export const PLC_DID_RE = /^did:plc:([a-z2-7]{24})$/;

export const isPlcDid = (input: string): input is Did<'plc'> => {
	return input.length === 32 && PLC_DID_RE.test(input);
};

export const isAtprotoDid = (input: string): input is AtprotoDid => {
	return isPlcDid(input) || isAtprotoWebDid(input);
};
