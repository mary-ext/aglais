import { XRPCError } from '@mary/bluesky-client/xrpc';

export const formatXRPCError = (err: XRPCError): string => {
	const name = err.kind;
	return (name ? name + ': ' : '') + err.message;
};

export const formatQueryError = (err: unknown) => {
	if (err instanceof XRPCError) {
		const kind = err.kind;
		const message = err.message;

		if (kind === 'InvalidToken' || kind === 'ExpiredToken') {
			return `Account session invalid, please sign in again`;
		}
		if (kind === 'UpstreamFailure') {
			return `Server appears to be experiencing issues, please try again later`;
		}
		if (message.includes('Bad token scope')) {
			return `This functionality is unavailable when using app passwords, please sign in with your main password`;
		}

		return formatXRPCError(err);
	}

	if (err instanceof Error) {
		if (/NetworkError|Failed to fetch|timed out|abort/.test(err.message)) {
			return `Unable to access the internet, please try again later`;
		}
	}

	return '' + err;
};
