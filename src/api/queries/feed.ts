import { modifyMutable, reconcile } from 'solid-js/store';

import type { AppBskyFeedDefs, At } from '@atcute/client/lexicons';
import { createQuery } from '@mary/solid-query';

import type { SavedGeneratorFeed } from '~/lib/preferences/account';
import { useAgent } from '~/lib/states/agent';
import { useSession } from '~/lib/states/session';

import { isDid, makeAtUri, parseAtUri } from '../utils/strings';

import { resolveHandle } from './handle';

export const createFeedMetaQuery = (feedUri: () => string) => {
	const { rpc } = useAgent();
	const { currentAccount } = useSession();

	return createQuery((queryClient) => {
		const $feedUri = feedUri();

		return {
			queryKey: ['feed-meta', $feedUri],
			async queryFn(ctx): Promise<AppBskyFeedDefs.GeneratorView> {
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
						feed: makeAtUri(did, uri.collection, uri.rkey),
					},
				});

				if (currentAccount) {
					const found = currentAccount.preferences.feeds.find((feed): feed is SavedGeneratorFeed => {
						return feed.type === 'generator' && feed.uri === $feedUri;
					});

					if (found) {
						modifyMutable(found.info, reconcile(data.view));
					}
				}

				return data.view;
			},
			placeholderData(): AppBskyFeedDefs.GeneratorView | undefined {
				return queryClient.getQueryData(['feed-meta-precache', $feedUri]);
			},
			initialData(): AppBskyFeedDefs.GeneratorView | undefined {
				if (currentAccount) {
					const $feedUri = feedUri();

					const found = currentAccount.preferences.feeds.find((feed): feed is SavedGeneratorFeed => {
						return feed.type === 'generator' && feed.uri === $feedUri;
					});

					return found?.info;
				}
			},
			initialDataUpdatedAt: 0,
		};
	});
};
