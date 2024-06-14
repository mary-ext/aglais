import { createQuery } from '@mary/solid-query';

import { useAgent } from '~/lib/states/agent';

export const useResolveHandleQuery = (handle: () => string) => {
	const { rpc } = useAgent();

	return createQuery(() => {
		const $handle = handle();

		return {
			queryKey: ['resolve-handle', $handle],
			async queryFn(ctx) {
				const { data } = await rpc.get('com.atproto.identity.resolveHandle', {
					signal: ctx.signal,
					params: {
						handle: $handle,
					},
				});

				return data.did;
			},
		};
	});
};
