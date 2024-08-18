import { XRPC } from '@atcute/client';
import { createQuery } from '@mary/solid-query';

import { useAgent } from '~/lib/states/agent';

export const useResolveHandleQuery = (handle: () => string) => {
	const { rpc } = useAgent();

	return createQuery(() => {
		const $handle = handle();

		return {
			queryKey: ['resolve-handle', $handle],
			async queryFn(ctx) {
				return resolveHandle(rpc, $handle, ctx.signal);
			},
		};
	});
};

export const resolveHandle = async (rpc: XRPC, handle: string, signal?: AbortSignal) => {
	const { data } = await rpc.get('com.atproto.identity.resolveHandle', {
		signal: signal,
		params: {
			handle: handle,
		},
	});

	return data.did;
};
