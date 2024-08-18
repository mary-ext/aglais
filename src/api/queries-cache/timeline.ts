import type { AppBskyActorDefs, AppBskyFeedDefs, At } from '@atcute/client/lexicons';
import type { InfiniteData } from '@mary/solid-query';

import type { CacheMatcher } from '../cache/utils';
import type { TimelinePage } from '../queries/timeline';
import { embedViewRecordToPostView, getEmbeddedPost } from '../utils/post';

export const findAllPosts = (uri: string, includeQuote = false): CacheMatcher<AppBskyFeedDefs.PostView> => {
	return {
		filter: {
			queryKey: ['timeline'],
		},
		*iterate(data: InfiniteData<TimelinePage>) {
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
		},
	};
};

export const findAllProfiles = (did: At.DID): CacheMatcher<AppBskyActorDefs.ProfileViewBasic> => {
	return {
		filter: {
			queryKey: ['timeline'],
		},
		*iterate(data: InfiniteData<TimelinePage>) {
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
		},
	};
};
