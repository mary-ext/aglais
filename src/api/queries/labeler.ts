import { ClientResponseError, ok } from '@atcute/client';
import type { AppBskyLabelerDefs, At } from '@atcute/client/lexicons';
import { createQuery } from '@mary/solid-query';

import { useAgent } from '~/lib/states/agent';

import { interpretLabelerDefinition } from '../moderation/labeler';

export const createLabelerMetaQuery = (did: () => At.Did) => {
	const { client } = useAgent();

	const query = createQuery(() => {
		const $did = did();

		return {
			queryKey: ['labeler-definition', $did],
			async queryFn(ctx) {
				const data = await ok(
					client.get('app.bsky.labeler.getServices', {
						signal: ctx.signal,
						params: {
							dids: [$did],
							detailed: true,
						},
					}),
				);

				const service = data.views[0] as AppBskyLabelerDefs.LabelerViewDetailed;

				if (!service) {
					throw new ClientResponseError({
						status: 400,
						data: { error: `NotFound`, message: `Labeler not found: ${$did}` },
					});
				}

				return interpretLabelerDefinition(service);
			},
		};
	});

	return query;
};
