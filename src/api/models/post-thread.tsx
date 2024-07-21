import type {
	AppBskyFeedDefs,
	AppBskyFeedGetPostThread,
	AppBskyFeedPost,
	Brand,
} from '@mary/bluesky-client/lexicons';

import type { ThreadViewPreferences } from '~/lib/preferences/account';

import {
	ContextContentList,
	getModerationUI,
	type ModerationCause,
	type ModerationOptions,
} from '../moderation';
import { moderatePost } from '../moderation/entities/post';

export const enum LineType {
	// <empty>
	NONE,
	// │
	VERTICAL,
	// ├
	VERTICAL_RIGHT,
	// └
	UP_RIGHT,
}

interface BaseAncestor {
	id: string;
	lines?: undefined;
}

export interface BlockedAncestorItem extends BaseAncestor {
	type: 'blocked';
	uri: string;
}
export interface NonexistentAncestorItem extends BaseAncestor {
	type: 'nonexistent';
	uri: string;
}
export interface OverflowAncestorItem extends BaseAncestor {
	type: 'overflow';
	uri: string;
}
export interface PostAncestorItem extends BaseAncestor {
	type: 'post';
	post: AppBskyFeedDefs.PostView;
	prev: boolean;
	next: boolean;
}

export type AncestorItem =
	| BlockedAncestorItem
	| NonexistentAncestorItem
	| OverflowAncestorItem
	| PostAncestorItem;

interface BaseDescendant {
	id: string;
	lines: LineType[];
}

export interface BlockedDescendantItem extends BaseDescendant {
	type: 'blocked';
	uri: string;
}
export interface OverflowDescendantItem extends BaseDescendant {
	type: 'overflow';
	uri: string;
}
export interface PostDescendantItem extends BaseDescendant {
	type: 'post';
	post: AppBskyFeedDefs.PostView;
	prev: boolean;
	next: boolean;
}

export type DescendantItem = BlockedDescendantItem | OverflowDescendantItem | PostDescendantItem;

export type ThreadModerationCache = WeakMap<AppBskyFeedDefs.PostView, ModerationCause[]>;

export interface ThreadData {
	post: AppBskyFeedDefs.PostView;
	ancestors: AncestorItem[];
	descendants: DescendantItem[];
	preferences: ThreadViewPreferences;
	modCache: ThreadModerationCache;
}

export const fillModerationCache = (
	cache: ThreadModerationCache,
	thread: AppBskyFeedGetPostThread.Output['thread'],
	options: ModerationOptions,
) => {
	if (thread.$type === 'app.bsky.feed.defs#threadViewPost') {
		const post = thread.post;
		const parent = thread.parent;
		const replies = thread.replies;

		if (parent !== undefined) {
			fillModerationCache(cache, parent, options);
		}

		cache.set(post, moderatePost(post, options));

		if (replies?.length) {
			for (let idx = 0, len = replies.length; idx < len; idx++) {
				const reply = replies[idx];
				fillModerationCache(cache, reply, options);
			}
		}
	}
};

export const createThreadData = ({
	thread,
	preferences,
	moderationOptions,
}: {
	thread: Brand.Union<AppBskyFeedDefs.ThreadViewPost>;
	preferences: ThreadViewPreferences;
	moderationOptions: ModerationOptions;
}): ThreadData => {
	const { followsFirst, sort, treeView } = preferences;

	const modCache: ThreadModerationCache = new WeakMap();
	fillModerationCache(modCache, thread, moderationOptions);

	let ancestors: AncestorItem[];
	let descendants: DescendantItem[];

	{
		let parent = thread.parent;

		ancestors = [];

		while (parent) {
			const type = parent.$type;
			if (type === 'app.bsky.feed.defs#blockedPost') {
				const uri = parent.uri;
				const viewer = parent.author.viewer;

				if (!viewer?.blockedBy) {
					ancestors.push({ id: uri, type: 'blocked', uri: uri });
				} else {
					ancestors.push({ id: uri, type: 'nonexistent', uri: uri });
				}
			} else if (type === 'app.bsky.feed.defs#notFoundPost') {
				const uri = parent.uri;

				ancestors.push({ id: uri, type: 'nonexistent', uri: uri });
			} else if (type === 'app.bsky.feed.defs#threadViewPost') {
				const post = parent.post;

				ancestors.push({ id: post.uri, type: 'post', post: post, prev: true, next: true });
				parent = parent.parent;

				continue;
			}

			break;
		}

		{
			const last = ancestors[ancestors.length - 1];

			if (last && last.type === 'post') {
				const post = last.post;
				const reply = (post.record as AppBskyFeedPost.Record).reply;

				if (reply) {
					const uri = reply.parent.uri;

					ancestors.push({ id: uri, type: 'overflow', uri: uri });
				} else {
					last.prev = false;
				}
			}
		}

		ancestors.reverse();
	}

	{
		const traverse = (
			parent: AppBskyFeedDefs.PostView,
			replies: AppBskyFeedDefs.ThreadViewPost['replies'] | undefined,
			depth: number,
			lines: LineType[],
		): DescendantItem[] => {
			if (!replies || replies.length === 0) {
				if (depth !== 0 && parent.replyCount) {
					return [
						{
							id: 'overflow-' + parent.uri,
							type: 'overflow',
							uri: parent.uri,
							lines: treeView ? lines.concat(LineType.UP_RIGHT) : lines,
						},
					];
				}

				return [];
			}

			// Filter the replies to only what we want
			const items = replies.filter(
				(x): x is Brand.Union<AppBskyFeedDefs.ThreadViewPost | AppBskyFeedDefs.BlockedPost> => {
					return (
						x.$type === 'app.bsky.feed.defs#threadViewPost' ||
						(x.$type === 'app.bsky.feed.defs#blockedPost' && !x.author.viewer?.blockedBy)
					);
				},
			);

			// Sort the replies
			const did = parent.author.did;
			items.sort((a, b) => {
				if (a.$type !== 'app.bsky.feed.defs#threadViewPost') {
					return 1;
				}
				if (b.$type !== 'app.bsky.feed.defs#threadViewPost') {
					return -1;
				}

				const aPost = a.post;
				const aAuthor = aPost.author;
				const aIndexed = getDateInt(aPost.indexedAt);

				const bPost = b.post;
				const bAuthor = bPost.author;
				const bIndexed = getDateInt(aPost.indexedAt);

				// Prioritize replies from parent's author
				{
					const aIsByOp = aAuthor.did === did;
					const bIsByOp = bAuthor.did === did;

					if (aIsByOp && bIsByOp) {
						// Prioritize oldest first for own reply
						return aIndexed - bIndexed;
					} else if (aIsByOp) {
						return -1;
					} else if (bIsByOp) {
						return 1;
					}
				}

				// Prioritize replies from follows
				if (followsFirst) {
					const aFollowing = aAuthor.viewer?.following;
					const bFollowing = bAuthor.viewer?.following;

					if (aFollowing && !bFollowing) {
						return -1;
					} else if (!aFollowing && bFollowing) {
						return 1;
					}
				}

				// Deprioritize blurred replies
				{
					const aBlurred = getModerationUI(modCache.get(aPost), ContextContentList).b.length !== 0;
					const bBlurred = getModerationUI(modCache.get(bPost), ContextContentList).b.length !== 0;

					if (aBlurred && !bBlurred) {
						return 1;
					} else if (!aBlurred && bBlurred) {
						return -1;
					}
				}

				// Sort based on preferred option
				switch (sort) {
					case 'clout': {
						// Prioritize newest first if the same count
						return getPostClout(bPost) - getPostClout(aPost) || bIndexed - aIndexed;
					}
					case 'most-likes': {
						const aLikes = aPost.likeCount ?? 0;
						const bLikes = bPost.likeCount ?? 0;

						// Prioritize newest first if the same count
						return bLikes - aLikes || bIndexed - aIndexed;
					}
					case 'newest': {
						return bIndexed - aIndexed;
					}
					case 'oldest': {
						return aIndexed - bIndexed;
					}
				}
			});

			// Iterate through the replies
			const array: DescendantItem[] = [];
			for (let idx = 0, len = items.length; idx < len; idx++) {
				const reply = items[idx];
				const type = reply.$type;

				const end = idx === len - 1;
				const nlines =
					treeView && depth !== 0 ? lines.concat(end ? LineType.UP_RIGHT : LineType.VERTICAL_RIGHT) : lines;

				if (type === 'app.bsky.feed.defs#threadViewPost') {
					const post = reply.post;
					const children = traverse(
						post,
						reply.replies,
						depth + 1,
						treeView && depth !== 0 ? lines.concat(end ? LineType.NONE : LineType.VERTICAL) : lines,
					);

					array.push({
						id: post.uri,
						type: 'post',
						post: post,
						prev: depth !== 0,
						next: children.length !== 0,
						lines: nlines,
					});

					push(array, children);
				} else if (type === 'app.bsky.feed.defs#blockedPost') {
					array.push({
						id: reply.uri,
						type: 'blocked',
						uri: reply.uri,
						lines: nlines,
					});
				}

				if (!treeView && depth !== 0) {
					break;
				}
			}

			return array;
		};

		descendants = Array.from(traverse(thread.post, thread.replies, 0, []));
	}

	return {
		post: thread.post,
		ancestors: ancestors,
		descendants: descendants,

		preferences: preferences,
		modCache: modCache,
	};
};

const getDateInt = (timestamp: string): number => {
	return new Date(timestamp).getTime();
};

const push = <T,>(target: T[], source: T[]) => {
	for (let idx = 0, len = source.length; idx < len; idx++) {
		const item = source[idx];
		target.push(item);
	}
};

const getPostClout = (post: AppBskyFeedDefs.PostView) => {
	return (post.likeCount ?? 0) * 1.25 + (post.repostCount ?? 0) * 1.125 + (post.replyCount ?? 0) * 1;
};
