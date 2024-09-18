import type { At } from '@atcute/client/lexicons';
import { createQuery } from '@mary/solid-query';

import { useAgent } from '~/lib/states/agent';

import { isDid, parseAtUri } from '../utils/strings';

import { resolveHandle } from './handle';

export const createFeedMetaQuery = (feedUri: () => string) => {
	const { rpc } = useAgent();

	return createQuery((queryClient) => {
		const $feedUri = feedUri();

		return {
			queryKey: ['feed-meta', $feedUri],
			async queryFn(ctx) {
				const uri = parseAtUri($feedUri);

				let did: At.DID;
				if (isDid(uri.repo)) {
					did = uri.repo;
				} else {
					did = await resolveHandle(rpc, uri.repo, ctx.signal);
				}

				const { data } = await rpc.get('app.bsky.feed.getFeedGenerator', {
					signal: ctx.signal,
					params: {
						feed: `at://${did}/${uri.collection}/${uri.rkey}`,
					},
				});

				return data.view;
			},
			placeholderData() {
				return queryClient.getQueryData(['feed-meta-precache', $feedUri]);
			},
		};
	});
};
