import type { AppBskyActorDefs, AppBskyFeedDefs, At } from '@mary/bluesky-client/lexicons';
import type { InfiniteData, QueryClient } from '@mary/solid-query';

import type { BookmarkFeedReturn } from '../queries/bookmark-feed';
import { embedViewRecordToPostView, getEmbeddedPost } from '../utils/post';

export function* findAllPostsInQueryData(
	queryClient: QueryClient,
	uri: string,
	includeQuote = false,
): Generator<AppBskyFeedDefs.PostView> {
	const entries = queryClient.getQueriesData<InfiniteData<BookmarkFeedReturn>>({
		queryKey: ['post-thread'],
	});

	for (const [_key, data] of entries) {
		if (data === undefined) {
			continue;
		}

		for (const page of data.pages) {
			for (const item of page.items) {
				if (item.stale) {
					continue;
				}

				const post = item.post;

				if (post.uri === uri) {
					yield post;
				}

				if (includeQuote) {
					const embeddedPost = getEmbeddedPost(post.embed);
					if (embeddedPost && embeddedPost.uri === uri) {
						yield embedViewRecordToPostView(embeddedPost);
					}
				}
			}
		}
	}
}

export function* findAllProfilesInQueryData(
	queryClient: QueryClient,
	did: At.DID,
): Generator<AppBskyActorDefs.ProfileViewBasic> {
	const entries = queryClient.getQueriesData<InfiniteData<BookmarkFeedReturn>>({
		queryKey: ['post-thread'],
	});

	for (const [_key, data] of entries) {
		if (data === undefined) {
			continue;
		}

		for (const page of data.pages) {
			for (const item of page.items) {
				if (item.stale) {
					continue;
				}

				const post = item.post;

				if (post.author.did === did) {
					yield post.author;
				}

				const embeddedPost = getEmbeddedPost(post.embed);
				if (embeddedPost && embeddedPost.author.did === did) {
					yield embeddedPost.author;
				}
			}
		}
	}
}
