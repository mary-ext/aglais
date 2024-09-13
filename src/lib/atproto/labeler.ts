import { type FetchHandler, type FetchHandlerObject, buildFetchHandler } from '@atcute/client';
import type { At } from '@atcute/client/lexicons';
import { mergeHeaders } from '@atcute/client/utils/http';

export interface Labeler {
	did: At.DID;
	redact: boolean;
}

export const attachLabelerHeaders = (
	handler: FetchHandler | FetchHandlerObject,
	labelers: () => Labeler[],
): FetchHandler => {
	const next = buildFetchHandler(handler);

	return (pathname, init) => {
		return next(pathname, {
			...init,
			headers: mergeHeaders(init.headers, {
				'atproto-accept-labelers': labelers()
					.map((labeler) => labeler.did + (labeler.redact ? `;redact` : ``))
					.join(', '),
			}),
		});
	};
};
