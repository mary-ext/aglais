import type { AppBskyActorDefs, AppBskyFeedDefs, At } from '@mary/bluesky-client/lexicons';
import type { InfiniteData, QueryClient } from '@mary/solid-query';

import type { TimelinePage } from '../queries/timeline';
import { embedViewRecordToPostView, getEmbeddedPost } from '../utils/post';

export function* findAllPostsInQueryData(
	queryClient: QueryClient,
	uri: string,
	includeQuote = false,
): Generator<AppBskyFeedDefs.PostView> {
	const entries = queryClient.getQueriesData<InfiniteData<TimelinePage>>({
		queryKey: ['timeline'],
	});

	for (const [_key, data] of entries) {
		if (data === undefined) {
			continue;
		}

		for (const page of data.pages) {
			for (const item of page.items) {
				const post = item.post;
				const reply = item.reply;

				if (post.uri === uri) {
					yield post;
				}

				if (includeQuote) {
					const embeddedPost = getEmbeddedPost(post.embed);
					if (embeddedPost && embeddedPost.uri === uri) {
						yield embedViewRecordToPostView(embeddedPost);
					}
				}

				if (reply !== undefined) {
					const parent = reply.parent;
					const root = reply.root;

					if (parent !== undefined) {
						if (parent.uri === uri) {
							yield parent;
						}

						if (includeQuote) {
							const embeddedPost = getEmbeddedPost(parent.embed);
							if (embeddedPost && embeddedPost.uri === uri) {
								yield embedViewRecordToPostView(embeddedPost);
							}
						}
					}

					if (root !== undefined) {
						if (root.uri === uri) {
							yield root;
						}

						if (includeQuote) {
							const embeddedPost = getEmbeddedPost(root.embed);
							if (embeddedPost && embeddedPost.uri === uri) {
								yield embedViewRecordToPostView(embeddedPost);
							}
						}
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
	const entries = queryClient.getQueriesData<InfiniteData<TimelinePage>>({
		queryKey: ['timeline'],
	});

	for (const [_key, data] of entries) {
		if (data === undefined) {
			continue;
		}

		for (const page of data.pages) {
			for (const item of page.items) {
				const post = item.post;
				const reply = item.reply;

				{
					if (post.author.did === did) {
						yield post.author;
					}

					const embeddedPost = getEmbeddedPost(post.embed);
					if (embeddedPost && embeddedPost.author.did === did) {
						yield embeddedPost.author;
					}
				}

				if (reply !== undefined) {
					const parent = reply.parent;
					const root = reply.root;

					if (parent !== undefined) {
						if (parent.author.did === did) {
							yield parent.author;
						}

						const embeddedPost = getEmbeddedPost(parent.embed);
						if (embeddedPost && embeddedPost.author.did === did) {
							yield embeddedPost.author;
						}
					}

					if (root !== undefined) {
						if (root.author.did === did) {
							yield root.author;
						}

						const embeddedPost = getEmbeddedPost(root.embed);
						if (embeddedPost && embeddedPost.author.did === did) {
							yield embeddedPost.author;
						}
					}
				}
			}
		}
	}
}
