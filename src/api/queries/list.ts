import { modifyMutable, reconcile } from 'solid-js/store';

import type { AppBskyGraphDefs, At } from '@atcute/client/lexicons';
import { createQuery } from '@mary/solid-query';

import type { SavedListFeed } from '~/lib/preferences/account';
import { useAgent } from '~/lib/states/agent';
import { useSession } from '~/lib/states/session';
import { omit } from '~/lib/utils/misc';

import { isDid, makeAtUri, parseAtUri } from '../utils/strings';

import { resolveHandle } from './handle';

export const createListMetaQuery = (listUri: () => string) => {
	const { rpc } = useAgent();
	const { currentAccount } = useSession();

	return createQuery((queryClient) => {
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

				if (currentAccount) {
					const found = currentAccount.preferences.feeds.find((item): item is SavedListFeed => {
						return item.type === 'list' && item.info.uri === $listUri;
					});

					if (found) {
						const persisted = omit(data.list, ['listItemCount']);
						modifyMutable(found.info, reconcile(persisted, { merge: true }));
					}
				}

				return data.list;
			},
			placeholderData(): AppBskyGraphDefs.ListView | undefined {
				return queryClient.getQueryData(['list-meta-precache', $listUri]);
			},
			initialData(): AppBskyGraphDefs.ListView | undefined {
				if (currentAccount) {
					const found = currentAccount.preferences.feeds.find((item): item is SavedListFeed => {
						return item.type === 'list' && item.info.uri === $listUri;
					});

					return found?.info;
				}
			},
			initialDataUpdatedAt: 0,
		};
	});
};
