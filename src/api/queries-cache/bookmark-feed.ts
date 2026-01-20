import type { AppBskyActorDefs, AppBskyFeedDefs } from '@atcute/bluesky';
import type { Did } from '@atcute/lexicons';
import type { InfiniteData } from '@mary/solid-query';

import type { CacheMatcher } from '../cache/utils';
import type { BookmarksPage } from '../queries/bookmark';
import { embedViewRecordToPostView, getEmbeddedPost } from '../utils/post';

export const findAllPosts = (uri: string, includeQuote = false): CacheMatcher<AppBskyFeedDefs.PostView> => {
	return {
		filter: {
			queryKey: ['bookmarks'],
		},
		*iterate(data: InfiniteData<BookmarksPage>) {
			for (const page of data.pages) {
				for (const bookmark of page.bookmarks) {
					const item = bookmark.item;

					// skip blocked or not found posts
					if (item.$type !== 'app.bsky.feed.defs#postView') {
						continue;
					}

					if (item.uri === uri) {
						yield item;
					}

					if (includeQuote) {
						const embeddedPost = getEmbeddedPost(item.embed);
						if (embeddedPost && embeddedPost.uri === uri) {
							yield embedViewRecordToPostView(embeddedPost);
						}
					}
				}
			}
		},
	};
};

export const findAllProfiles = (did: Did): CacheMatcher<AppBskyActorDefs.ProfileViewBasic> => {
	return {
		filter: {
			queryKey: ['bookmarks'],
		},
		*iterate(data: InfiniteData<BookmarksPage>) {
			for (const page of data.pages) {
				for (const bookmark of page.bookmarks) {
					const item = bookmark.item;

					// skip blocked or not found posts
					if (item.$type !== 'app.bsky.feed.defs#postView') {
						continue;
					}

					if (item.author.did === did) {
						yield item.author;
					}

					const embeddedPost = getEmbeddedPost(item.embed);
					if (embeddedPost && embeddedPost.author.did === did) {
						yield embeddedPost.author;
					}
				}
			}
		},
	};
};
