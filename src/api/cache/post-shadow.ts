import { batch, createRenderEffect, createSignal, onCleanup, type Accessor } from 'solid-js';

import type { AppBskyFeedDefs } from '@mary/bluesky-client/lexicons';
import { EventEmitter } from '@mary/events';
import type { QueryClient } from '@mary/solid-query';

import { findAllPostsInQueryData as findAllPostsInBookmarkFeedQueryData } from '../queries/bookmark-feed';
import { findAllPostsInQueryData as findAllPostsInPostThreadQueryData } from '../queries/post-thread';
import { findAllPostsInQueryData as findAllPostsInTimelineQueryData } from '../queries/timeline';
import { EQUALS_DEQUAL } from '../utils/dequal';
import type { AccessorMaybe } from '../utils/types';

export interface PostShadow {
	deleted?: boolean;
	likeUri?: string;
	repostUri?: string;
	threadMuted?: boolean;
}

export interface PostShadowView {
	deleted: boolean;
	likeCount: number;
	likeUri: string | undefined;
	repostCount: number;
	repostUri: string | undefined;
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
		threadMuted: ('threadMuted' in shadow ? shadow.threadMuted : post.viewer?.threadMuted) ?? false,
	};
};

export const updatePostShadow = (queryClient: QueryClient, uri: string, value: Partial<PostShadow>) => {
	for (const post of findPostsInCache(queryClient, uri, true)) {
		shadows.set(post, { ...shadows.get(post), ...value });
	}

	batch(() => emitter.emit(uri));
};

export function* findPostsInCache(
	queryClient: QueryClient,
	uri: string,
	includeQuote = false,
): Generator<AppBskyFeedDefs.PostView> {
	yield* findAllPostsInTimelineQueryData(queryClient, uri, includeQuote);
	yield* findAllPostsInPostThreadQueryData(queryClient, uri, includeQuote);
	yield* findAllPostsInBookmarkFeedQueryData(queryClient, uri, includeQuote);
}
