import type { AppBskyActorDefs, AppBskyFeedDefs, At } from '@mary/bluesky-client/lexicons';
import type { InfiniteData } from '@mary/solid-query';

import type { CacheMatcher } from '../cache/utils';
import type { BookmarkFeedReturn } from '../queries/bookmark-feed';
import { embedViewRecordToPostView, getEmbeddedPost } from '../utils/post';

export const findAllPosts = (uri: string, includeQuote = false): CacheMatcher<AppBskyFeedDefs.PostView> => {
	return {
		filter: {
			queryKey: ['bookmarks-feed'],
		},
		*iterate(data: InfiniteData<BookmarkFeedReturn>) {
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
		},
	};
};

export const findAllProfiles = (did: At.DID): CacheMatcher<AppBskyActorDefs.ProfileViewBasic> => {
	return {
		filter: {
			queryKey: ['bookmarks-feed'],
		},
		*iterate(data: InfiniteData<BookmarkFeedReturn>) {
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
		},
	};
};
