import type { At } from '@atcute/client/lexicons';
import { createQuery } from '@mary/solid-query';

import { useAgent } from '~/lib/states/agent';

import { findPostsInCache } from '../cache/post-shadow';
import { isDid, makeAtUri, parseAtUri } from '../utils/strings';

import { resolveHandle } from './handle';

export const createPostQuery = (postUri: () => string) => {
	const { rpc } = useAgent();

	return createQuery((queryClient) => {
		const $postUri = postUri();

		return {
			queryKey: ['post', $postUri],
			async queryFn(ctx) {
				const uri = parseAtUri($postUri);

				let did: At.DID;
				if (isDid(uri.repo)) {
					did = uri.repo;
				} else {
					did = await resolveHandle(rpc, uri.repo, ctx.signal);
				}

				const { data } = await rpc.get('app.bsky.feed.getPosts', {
					signal: ctx.signal,
					params: {
						uris: [makeAtUri(did, uri.collection, uri.rkey)],
					},
				});

				const post = data.posts[0];

				if (!post) {
					throw new Error(`Post not found`);
				}

				return post;
			},
			initialData() {
				for (const post of findPostsInCache(queryClient, $postUri, true)) {
					return post;
				}

				return undefined;
			},
		};
	});
};
