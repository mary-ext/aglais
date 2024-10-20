import { type Accessor, batch, createRenderEffect, createSignal, onCleanup } from 'solid-js';

import type { AppBskyFeedDefs } from '@atcute/client/lexicons';
import { EventEmitter } from '@mary/events';
import type { QueryClient } from '@mary/solid-query';

import { findAllPosts as findAllPostsInBookmarkFeed } from '../queries-cache/bookmark-feed';
import { findAllPosts as findAllPostsInNotificationFeed } from '../queries-cache/notification-feed';
import { findAllPosts as findAllPostsInPostQuotes } from '../queries-cache/post-quotes';
import { findAllPosts as findAllPostsInPostThread } from '../queries-cache/post-thread';
import { findAllPosts as findAllPostsInTimeline } from '../queries-cache/timeline';
import { EQUALS_DEQUAL } from '../utils/dequal';
import type { AccessorMaybe } from '../utils/types';

import { iterateQueryCache } from './utils';

export interface PostShadow {
	deleted?: boolean;
	likeUri?: string;
	repostUri?: string;
	pinned?: boolean;
	threadMuted?: boolean;
}

export interface PostShadowView {
	deleted: boolean;
	likeCount: number;
	likeUri: string | undefined;
	repostCount: number;
	repostUri: string | undefined;
	pinned: boolean;
	threadMuted: boolean;
}

const emitter = new EventEmitter<{ [uri: string]: () => void }>();
const shadows = new WeakMap<AppBskyFeedDefs.PostView, PostShadow>();

export const usePostShadow = (post: AccessorMaybe<AppBskyFeedDefs.PostView>): Accessor<PostShadowView> => {
	if (typeof post === 'function') {
		const [view, setView] = createSignal<PostShadowView>(undefined as any, EQUALS_DEQUAL);

		createRenderEffect(() => {
			const $post = post();

			setView(getPostShadow($post));
			onCleanup(emitter.on($post.uri, () => setView(getPostShadow($post))));
		});

		return view;
	} else {
		const [view, setView] = createSignal(getPostShadow(post), EQUALS_DEQUAL);

		onCleanup(emitter.on(post.uri, () => setView(getPostShadow(post))));
		return view;
	}
};

export const getPostShadow = (post: AppBskyFeedDefs.PostView): PostShadowView => {
	const shadow = shadows.get(post) ?? {};

	let likeCount = post.likeCount ?? 0;
	let repostCount = post.repostCount ?? 0;

	if ('likeUri' in shadow) {
		const wasLiked = !!post.viewer?.like;
		const isLiked = !!shadow.likeUri;

		if (wasLiked && !isLiked) {
			likeCount--;
		} else if (!wasLiked && isLiked) {
			likeCount++;
		}

		likeCount = Math.max(0, likeCount);
	}

	if ('repostUri' in shadow) {
		const wasReposted = !!post.viewer?.repost;
		const isReposted = !!shadow.repostUri;

		if (wasReposted && !isReposted) {
			repostCount--;
		} else if (!wasReposted && isReposted) {
			repostCount++;
		}

		repostCount = Math.max(0, repostCount);
	}

	return {
		deleted: shadow.deleted ?? false,
		likeCount: likeCount,
		likeUri: 'likeUri' in shadow ? shadow.likeUri : post.viewer?.like,
		repostCount: repostCount,
		repostUri: 'repostUri' in shadow ? shadow.repostUri : post.viewer?.repost,
		pinned: ('pinned' in shadow ? shadow.pinned : post.viewer?.pinned) ?? false,
		threadMuted: ('threadMuted' in shadow ? shadow.threadMuted : post.viewer?.threadMuted) ?? false,
	};
};

export const updatePostShadow = (queryClient: QueryClient, uri: string, value: Partial<PostShadow>) => {
	for (const post of findPostsInCache(queryClient, uri, true)) {
		shadows.set(post, { ...shadows.get(post), ...value });
	}

	batch(() => emitter.emit(uri));
};

export function findPostsInCache(
	queryClient: QueryClient,
	uri: string,
	includeQuote = false,
): Generator<AppBskyFeedDefs.PostView> {
	return iterateQueryCache(queryClient, [
		findAllPostsInTimeline(uri, includeQuote),
		findAllPostsInPostThread(uri, includeQuote),
		findAllPostsInPostQuotes(uri, includeQuote),
		findAllPostsInBookmarkFeed(uri, includeQuote),
		findAllPostsInNotificationFeed(uri, includeQuote),
	]);
}
