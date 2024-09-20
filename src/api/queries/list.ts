import type { At } from '@atcute/client/lexicons';
import { createQuery } from '@mary/solid-query';

import { useAgent } from '~/lib/states/agent';

import { isDid, makeAtUri, parseAtUri } from '../utils/strings';

import { resolveHandle } from './handle';

export const createListMetaQuery = (listUri: () => string) => {
	const { rpc } = useAgent();

	return createQuery(() => {
		const $listUri = listUri();

		return {
			queryKey: ['list-meta', $listUri],
			async queryFn(ctx) {
				const uri = parseAtUri($listUri);

				let did: At.DID;
				if (isDid(uri.repo)) {
					did = uri.repo;
				} else {
					did = await resolveHandle(rpc, uri.repo, ctx.signal);
				}

				const { data } = await rpc.get('app.bsky.graph.getList', {
					signal: ctx.signal,
					params: {
						list: makeAtUri(did, uri.collection, uri.rkey),
						limit: 1,
					},
				});

				return data.list;
			},
		};
	});
};
