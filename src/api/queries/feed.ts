import type { AppBskyFeedDefs, At } from '@mary/bluesky-client/lexicons';
import { createQuery } from '@mary/solid-query';

import { useAgent } from '~/lib/states/agent';
import { isDid, parseAtUri } from '../utils/strings';
import { resolveHandle } from './handle';

export interface ExtendedGeneratorView extends AppBskyFeedDefs.GeneratorView {
	isOnline: boolean;
	isValid: boolean;
}

export const createFeedMetaQuery = (feedUri: () => string) => {
	const { rpc } = useAgent();

	return createQuery(() => {
		const $feedUri = feedUri();

		return {
			queryKey: ['feed-meta', $feedUri],
			async queryFn(ctx): Promise<ExtendedGeneratorView> {
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

				return {
					...data.view,
					isOnline: data.isOnline,
					isValid: data.isValid,
				};
			},
		};
	});
};
