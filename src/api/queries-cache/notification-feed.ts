import type { AppBskyActorDefs, AppBskyFeedDefs, At } from '@mary/bluesky-client/lexicons';
import type { InfiniteData } from '@mary/solid-query';

import type { CacheMatcher } from '../cache/utils';
import type { NotificationFeedReturn } from '../queries/notification-feed';
import { embedViewRecordToPostView, getEmbeddedPost } from '../utils/post';

export const findAllPosts = (uri: string, includeQuote = false): CacheMatcher<AppBskyFeedDefs.PostView> => {
	return {
		filter: {
			queryKey: ['notification', 'feed'],
			exact: true,
		},
		*iterate(data: InfiniteData<NotificationFeedReturn>) {
			for (const page of data.pages) {
				for (const slice of page.slices) {
					const type = slice.type;

					if (type === 'follow') {
						continue;
					}

					const post = slice.view;

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

export const findAllProfiles = (
	did: At.DID,
): CacheMatcher<AppBskyActorDefs.ProfileViewBasic | AppBskyActorDefs.ProfileView> => {
	return {
		filter: {
			queryKey: ['notification', 'feed'],
			exact: true,
		},
		*iterate(data: InfiniteData<NotificationFeedReturn>) {
			for (const page of data.pages) {
				for (const slice of page.slices) {
					const type = slice.type;

					if (type === 'follow' || type === 'like' || type === 'repost') {
						for (const notif of slice.items) {
							const author = notif.author;

							if (author.did === did) {
								yield author;
							}
						}
					}

					if (type !== 'follow') {
						const post = slice.view;

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
		},
	};
};
