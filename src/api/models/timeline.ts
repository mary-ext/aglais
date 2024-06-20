import type { AppBskyActorDefs, AppBskyFeedDefs } from '@mary/bluesky-client/lexicons';

type Post = AppBskyFeedDefs.PostView;
type TimelineItem = AppBskyFeedDefs.FeedViewPost;
type ReplyRef = AppBskyFeedDefs.ReplyRef;

// EnsuredTimelineItem
export interface EnsuredReplyRef {
	root: Post | undefined;
	parent: Post | undefined;
	grandparentAuthor: AppBskyActorDefs.ProfileViewBasic | undefined;
}

export const ensureReplyRef = (reply: ReplyRef | undefined): EnsuredReplyRef | undefined => {
	if (reply) {
		const root = reply.root;
		const parent = reply.parent;
		const grandparentAuthor = reply.grandparentAuthor;

		// Thread started, or this is replying to a blocked user, skip this.
		// Thread started by a blocked user, skip this.
		if (isBlocking(root) || isBlocking(parent)) {
			return;
		}

		return {
			root: root.$type === 'app.bsky.feed.defs#postView' ? root : undefined,
			parent: parent.$type === 'app.bsky.feed.defs#postView' ? parent : undefined,
			grandparentAuthor: grandparentAuthor,
		};
	}
};

const isBlocking = (post: ReplyRef['parent']): boolean => {
	if (post.$type === 'app.bsky.feed.defs#blockedPost') {
		const viewer = post.author.viewer;
		return !!(viewer?.blocking || viewer?.blockedBy);
	}

	return false;
};

export interface EnsuredTimelineItem {
	post: Post;
	reply: EnsuredReplyRef | undefined;
	reason: TimelineItem['reason'];
}

export const ensureTimelineItem = (item: TimelineItem): EnsuredTimelineItem => {
	return {
		post: item.post,
		reply: ensureReplyRef(item.reply),
		reason: item.reason,
	};
};
// TimelineSlice
export interface TimelineSlice {
	items: EnsuredTimelineItem[];
}

// UiTimelineItem
export interface UiTimelineItem extends EnsuredTimelineItem {
	prev: boolean;
	next: boolean;
}

export type SliceFilter = (slice: TimelineSlice) => boolean | TimelineSlice[];
export type PostFilter = (item: EnsuredTimelineItem) => boolean;

const isNextInThread = (slice: TimelineSlice, item: EnsuredTimelineItem) => {
	const items = slice.items;
	const last = items[items.length - 1];

	const parent = item.reply?.parent;

	return !!parent && last.post.cid == parent.cid;
};

const isFirstInThread = (slice: TimelineSlice, item: EnsuredTimelineItem) => {
	const items = slice.items;
	const first = items[0];

	const parent = first.reply?.parent;

	return !!parent && parent.cid === item.post.cid;
};

const isArray = Array.isArray;

export const createJoinedItems = (
	arr: TimelineItem[],
	filterSlice?: SliceFilter,
	filterPost?: PostFilter,
): UiTimelineItem[] => {
	let slices: TimelineSlice[] = [];
	let jlen = 0;

	// arrange the posts into connected slices
	loop: for (let i = arr.length - 1; i >= 0; i--) {
		const item = ensureTimelineItem(arr[i]);

		if (filterPost && !filterPost(item)) {
			continue;
		}

		// if we find a matching slice and it's currently not in front, then bump
		// it to the front. this is so that new reply don't get buried away because
		// there's multiple posts separating it and the parent post.
		for (let j = 0; j < jlen; j++) {
			const slice = slices[j];

			if (isFirstInThread(slice, item)) {
				slice.items.unshift(item);

				if (j !== 0) {
					slices.splice(j, 1);
					slices.unshift(slice);
				}

				continue loop;
			} else if (isNextInThread(slice, item)) {
				slice.items.push(item);

				if (j !== 0) {
					slices.splice(j, 1);
					slices.unshift(slice);
				}

				continue loop;
			}
		}

		slices.unshift({ items: [item] });
		jlen++;
	}

	if (filterSlice && jlen > 0) {
		const unfiltered = slices;
		slices = [];

		for (let j = 0; j < jlen; j++) {
			const slice = unfiltered[j];
			const result = filterSlice(slice);

			if (result) {
				if (isArray(result)) {
					for (let k = 0, klen = result.length; k < klen; k++) {
						const slice = result[k];
						slices.push(slice);
					}
				} else {
					slices.push(slice);
				}
			}
		}
	}

	return slices.flatMap((slice) => {
		const arr = slice.items;
		const len = arr.length;

		return arr.map((item, idx): UiTimelineItem => {
			return {
				...item,
				prev: idx !== 0,
				next: idx !== len - 1,
			};
		});
	});
};
