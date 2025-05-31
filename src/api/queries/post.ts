import { ok } from '@atcute/client';
import { type Did } from '@atcute/lexicons';
import { isDid } from '@atcute/lexicons/syntax';
import { createQuery } from '@mary/solid-query';

import { useAgent } from '~/lib/states/agent';

import { findPostsInCache } from '../cache/post-shadow';
import { assertCanonicalResourceUri, makeAtUri } from '../types/at-uri';

import { resolveHandle } from './handle';

export const createPostQuery = (postUri: () => string) => {
	const { client } = useAgent();

	return createQuery((queryClient) => {
		const $postUri = postUri();

		return {
			queryKey: ['post', $postUri],
			async queryFn(ctx) {
				const uri = assertCanonicalResourceUri($postUri);

				let did: Did;
				if (isDid(uri.repo)) {
					did = uri.repo;
				} else {
					did = await resolveHandle(client, uri.repo, ctx.signal);
				}

				const data = await ok(
					client.get('app.bsky.feed.getPosts', {
						signal: ctx.signal,
						params: {
							uris: [makeAtUri(did, uri.collection, uri.rkey)],
						},
					}),
				);

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
