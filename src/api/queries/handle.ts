import { type Client, ok } from '@atcute/client';
import type { Handle } from '@atcute/lexicons';
import { createQuery } from '@mary/solid-query';

import { useAgent } from '~/lib/states/agent';

export const useResolveHandleQuery = (handle: () => Handle) => {
	const { client } = useAgent();

	return createQuery(() => {
		const $handle = handle();

		return {
			queryKey: ['resolve-handle', $handle],
			async queryFn(ctx) {
				return resolveHandle(client, $handle, ctx.signal);
			},
		};
	});
};

export const resolveHandle = async (client: Client, handle: Handle, signal?: AbortSignal) => {
	const data = await ok(
		client.get('com.atproto.identity.resolveHandle', {
			signal: signal,
			params: {
				handle: handle,
			},
		}),
	);

	return data.did;
};
