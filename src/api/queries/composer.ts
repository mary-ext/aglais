import { createQuery } from '@mary/solid-query';

const LINK_PROXY_ENDPOINT = 'https://cardyb.bsky.app/v1/extract';

interface LinkProxyResponse {
	error: string;
	likely_type: string;
	url: string;
	title: string;
	description: string;
	image: string;
}

export interface LinkMeta {
	uri: string;
	title: string;
	description: string;
	thumb: Blob | undefined;
}

export const createLinkMetaQuery = (uri: () => string) => {
	return createQuery(() => {
		const $uri = uri();

		return {
			queryKey: ['link-meta', $uri],
			async queryFn(ctx) {
				const response = await fetch(`${LINK_PROXY_ENDPOINT}?url=${encodeURIComponent($uri)}`, {
					signal: followAbortSignal([ctx.signal, AbortSignal.timeout(5_000)]),
				});

				if (!response.ok) {
					throw new Error(`Failed to contact proxy: response error ${response.status}`);
				}

				const data = (await response.json()) as LinkProxyResponse;

				if (data.error != '') {
					throw new Error(`Proxy error: ${data.error}`);
				}

				let thumb: Blob | undefined;
				if (data.image != '') {
					try {
						const response = await fetch(data.image, {
							signal: followAbortSignal([ctx.signal, AbortSignal.timeout(10_000)]),
						});

						if (!response.ok) {
							throw new Error(`Failed to retrieve image: response error ${response.status}`);
						}

						const blob = await response.blob();
						thumb = blob;
					} catch {}
				}

				const meta: LinkMeta = {
					uri: $uri,
					title: data.title,
					description: data.description,
					thumb: thumb,
				};

				return meta;
			},
		};
	});
};

const followAbortSignal = (signals: (AbortSignal | undefined)[]) => {
	const controller = new AbortController();
	const own = controller.signal;

	for (let idx = 0, len = signals.length; idx < len; idx++) {
		const signal = signals[idx];

		if (!signal) {
			continue;
		}

		if (signal.aborted) {
			controller.abort(signal.reason);
			break;
		}

		signal.addEventListener('abort', () => controller.abort(signal.reason), { signal: own });
	}

	return own;
};
