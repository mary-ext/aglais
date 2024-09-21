import { XRPCError } from '@atcute/client';

export const formatXRPCError = (err: XRPCError): string => {
	const name = err.kind;
	return (name ? name + ': ' : '') + err.message;
};

export const formatQueryError = (err: unknown) => {
	if (err instanceof XRPCError) {
		const kind = err.kind;

		if (kind === 'invalid_token') {
			return `Account session is no longer valid`;
		}

		if (kind === 'UpstreamFailure') {
			return `Server appears to be experiencing issues, try again later`;
		}

		if (kind === 'InternalServerError') {
			return `Server is having issues processing this request, try again later`;
		}

		return formatXRPCError(err);
	}

	if (err instanceof Error) {
		if (/NetworkError|Failed to fetch|timed out|abort/.test(err.message)) {
			return `Unable to access the internet, try again later`;
		}
	}

	return '' + err;
};
