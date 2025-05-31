import { type FetchHandler, type FetchHandlerObject, buildFetchHandler } from '@atcute/client';
import type { Did } from '@atcute/lexicons';

export interface Labeler {
	did: Did;
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

const mergeHeaders = (
	init: HeadersInit | undefined,
	defaults: Record<string, string | null>,
): HeadersInit | undefined => {
	let headers: Headers | undefined;

	for (const name in defaults) {
		const value = defaults[name];

		if (value !== null) {
			headers ??= new Headers(init);

			if (!headers.has(name)) {
				headers.set(name, value);
			}
		}
	}

	return headers ?? init;
};
