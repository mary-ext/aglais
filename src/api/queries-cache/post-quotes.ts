import type { AppBskyFeedDefs, AppBskyFeedGetQuotes } from '@atcute/client/lexicons';
import type { InfiniteData } from '@mary/solid-query';

import type { CacheMatcher } from '../cache/utils';
import { embedViewRecordToPostView, getEmbeddedPost } from '../utils/post';

export const findAllPosts = (uri: string, includeQuote = false): CacheMatcher<AppBskyFeedDefs.PostView> => {
	return {
		filter: {
			queryKey: ['post-quotes'],
		},
		*iterate(data: InfiniteData<AppBskyFeedGetQuotes.Output>) {
			for (const page of data.pages) {
				for (const post of page.posts) {
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
