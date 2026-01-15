import type { AppBskyLabelerDefs } from '@atcute/bluesky';
import { ClientResponseError, ok } from '@atcute/client';
import type { Did } from '@atcute/lexicons';
import { createQuery } from '@mary/solid-query';

import { useAgent } from '~/lib/states/agent';

import { interpretLabelerDefinition } from '../moderation/labeler';

export const createLabelerMetaQuery = (did: () => Did) => {
	const { appview } = useAgent();

	const query = createQuery(() => {
		const $did = did();

		return {
			queryKey: ['labeler-definition', $did],
			async queryFn(ctx) {
				const data = await ok(
					appview.get('app.bsky.labeler.getServices', {
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
