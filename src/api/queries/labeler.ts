import { XRPCError } from '@atcute/client';
import type { AppBskyLabelerDefs, At } from '@atcute/client/lexicons';
import { createQuery } from '@mary/solid-query';

import { useAgent } from '~/lib/states/agent';

import { interpretLabelerDefinition } from '../moderation/labeler';

export const createLabelerMetaQuery = (did: () => At.DID) => {
	const { rpc } = useAgent();

	const query = createQuery(() => {
		const $did = did();

		return {
			queryKey: ['labeler-definition', $did],
			async queryFn(ctx) {
				const { data } = await rpc.get('app.bsky.labeler.getServices', {
					signal: ctx.signal,
					params: {
						dids: [$did],
						detailed: true,
					},
				});

				const service = data.views[0] as AppBskyLabelerDefs.LabelerViewDetailed;

				if (!service) {
					throw new XRPCError(400, { kind: 'NotFound', message: `Labeler not found: ${$did}` });
				}

				return interpretLabelerDefinition(service);
			},
		};
	});

	return query;
};
