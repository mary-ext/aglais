import { XRPCError } from '@mary/bluesky-client/xrpc';

export const formatXRPCError = (err: XRPCError): string => {
	const name = err.kind;
	return (name ? name + ': ' : '') + err.message;
};

export const formatQueryError = (err: unknown) => {
	if (err instanceof XRPCError) {
		const error = err.kind;

		if (error === 'InvalidToken' || error === 'ExpiredToken') {
			return `Account session invalid, please sign in again`;
		}

		return formatXRPCError(err);
	}

	return '' + err;
};
