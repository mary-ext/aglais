import { createEffect, createMemo, createRenderEffect, onCleanup, untrack } from 'solid-js';

import type { BskyXRPC } from '@mary/bluesky-client';
import type {
	AppBskyEmbedRecord,
	AppBskyFeedDefs,
	AppBskyFeedGetTimeline,
	AppBskyFeedPost,
	At,
} from '@mary/bluesky-client/lexicons';
import { createInfiniteQuery, createQuery, useQueryClient, type InfiniteData } from '@mary/solid-query';

import { globalEvents } from '~/globals/events';

import { assert } from '~/lib/invariant';
import { useAgent } from '~/lib/states/agent';
import { useModerationOptions } from '~/lib/states/moderation';
import { useSession } from '~/lib/states/session';

import {
	createJoinedItems,
	type EnsuredReplyRef,
	type EnsuredTimelineItem,
	type PostFilter,
	type SliceFilter,
	type TimelineSlice,
	type UiTimelineItem,
} from '../models/timeline';
import {
	ContextContentList,
	PreferenceHide,
	TargetContent,
	decideLabelModeration,
	decideMutedKeywordModeration,
	getModerationUI,
	type ModerationCause,
	type ModerationOptions,
} from '../moderation';

import { EQUALS_DEQUAL } from '../utils/dequal';
import { unwrapPostEmbedText } from '../utils/post';
import { resetInfiniteData, wrapQuery } from '../utils/query';
import { parseAtUri } from '../utils/strings';

type PostRecord = AppBskyFeedPost.Record;

export interface FollowingTimelineParams {
	type: 'following';
	showReplies: 'follows' | boolean;
	showReposts: boolean;
	showQuotes: boolean;
}

export interface FeedTimelineParams {
	type: 'feed';
	uri: string;
	showReplies: boolean;
	showReposts: boolean;
	showQuotes: boolean;
}

export interface ListTimelineParams {
	type: 'list';
	uri: string;
	showReplies: boolean;
	showQuotes: boolean;
}

export interface ProfileTimelineParams {
	type: 'profile';
	actor: At.DID;
	tab: 'posts' | 'replies' | 'likes' | 'media';
}

export interface SearchTimelineParams {
	type: 'search';
	query: string;
	sort: 'top' | 'latest';
}

export type TimelineParams =
	| FeedTimelineParams
	| FollowingTimelineParams
	| ListTimelineParams
	| ProfileTimelineParams
	| SearchTimelineParams;

export interface TimelinePage {
	cursor: string | undefined;
	cid: string | undefined;
	items: UiTimelineItem[];
}

export interface TimelineLatestResult {
	cid: string | undefined;
}

const MAX_TIMELINE_POSTS = 50;

export const useTimelineQuery = (_params: () => TimelineParams) => {
	const getParams = createMemo(() => _params(), EQUALS_DEQUAL);

	const { rpc } = useAgent();
	const { currentAccount } = useSession();
	const queryClient = useQueryClient();
	const moderationOptions = useModerationOptions();

	const limit = MAX_TIMELINE_POSTS;

	const timeline = createInfiniteQuery(() => {
		const params = getParams();

		return {
			queryKey: ['timeline', params],
			initialPageParam: undefined,
			getNextPageParam: (last) => last.cursor,
			staleTime: Infinity,
			structuralSharing: false,
			queryFn: wrapQuery<TimelinePage, string | undefined>(async (ctx) => {
				const uid = currentAccount?.did;
				const moderation = moderationOptions();

				const type = params.type;

				let cursor = ctx.pageParam;

				let sliceFilter: SliceFilter | undefined;
				let postFilter: PostFilter | undefined;

				if (type === 'following') {
					assert(uid !== undefined);

					sliceFilter = createHomeSliceFilter(uid, params.showReplies === 'follows');

					postFilter = combine([
						createHiddenRepostFilter(moderation),
						createDuplicatePostFilter(),

						!params.showReplies && createHideRepliesFilter(),
						!params.showQuotes && createHideQuotesFilter(),
						!params.showReposts && createHideRepostsFilter(),

						createHideQuotesFromMutedFilter(),
						createInvalidReplyFilter(),
						createLabelPostFilter(moderation),
						createTempMutePostFilter(uid, moderation),
					]);
				} else if (type === 'feed' || type === 'list') {
					sliceFilter = createFeedSliceFilter();

					postFilter = combine([
						type === 'feed' && createHiddenRepostFilter(moderation),
						createDuplicatePostFilter(),

						!params.showReplies && createHideRepliesFilter(),
						!params.showQuotes && createHideQuotesFilter(),
						type === 'feed' && !params.showReposts && createHideRepostsFilter(),

						createLabelPostFilter(moderation),
						uid && createTempMutePostFilter(uid, moderation),
					]);
				} else if (type === 'profile') {
					postFilter = createLabelPostFilter(moderation);

					if (params.tab === 'posts') {
						sliceFilter = createProfileSliceFilter(params.actor);
						postFilter = combine([createInvalidReplyFilter(), createLabelPostFilter(moderation)]);
					}
				} else {
					postFilter = createLabelPostFilter(moderation);
				}

				const timeline = await fetchPage(rpc, params, limit, cursor, ctx.signal);

				const feed = timeline.feed;
				const result = createJoinedItems(feed, sliceFilter, postFilter);

				const page: TimelinePage = {
					cursor: timeline.cursor,
					cid: feed.length > 0 ? feed[0].post.cid : undefined,
					items: result,
				};

				return page;
			}),
		};
	});

	const latest = createQuery<TimelineLatestResult>(() => {
		const params = getParams();
		const timelineData = timeline.data;

		return {
			queryKey: ['timeline-latest', params],
			enabled: timelineData !== undefined,
			staleTime: 30_000,
			refetchOnWindowFocus: (query) => {
				return !isTimelineStale(timelineData, query.state.data);
			},
			refetchInterval: (query) => {
				if (!isTimelineStale(timelineData, query.state.data)) {
					// 1 minute, or 5 minutes
					return !document.hidden ? 60_000 : 5 * 60_000;
				}

				return false;
			},
			async queryFn(ctx): Promise<TimelineLatestResult> {
				const timeline = await fetchPage(rpc, params, 1, undefined, ctx.signal);
				const feed = timeline.feed;

				return { cid: feed.length > 0 ? feed[0].post.cid : undefined };
			},
		};
	});

	const reset = () => {
		const params = untrack(getParams);

		resetInfiniteData(queryClient, ['timeline', params]);
		timeline.refetch();
	};

	const isStale = () => {
		return isTimelineStale(timeline.data, latest.data);
	};

	// This is a render effect such that changes to the timeline query immediately
	// mutates the stale check query before it has the chance to react itself.
	createRenderEffect((prev: typeof timeline.data | 0) => {
		const next = timeline.data;

		if (prev !== 0 && next) {
			const pages = next.pages;
			const length = pages.length;

			// Only mutate stale check if the length is exactly 1, as in, we've just
			// loaded the timeline, or refreshed it.
			if (length === 1) {
				// Untrack so we don't become dependent on this.
				const params = untrack(getParams);

				queryClient.setQueryData(
					['timeline-latest', params],
					{ cid: pages[0].cid },
					{ updatedAt: timeline.dataUpdatedAt },
				);
			}
		}

		return next;
	}, 0 as const);

	if (currentAccount) {
		createEffect(() => {
			const params = getParams();

			if (params.type === 'following' || (params.type === 'profile' && params.actor === currentAccount.did)) {
				onCleanup(
					globalEvents.on('postpublished', () => {
						latest.refetch();
					}),
				);
			}
		});
	}

	return { timeline, reset, isStale };
};

const isTimelineStale = (
	timelineData: InfiniteData<TimelinePage> | undefined,
	latestData: TimelineLatestResult | undefined,
) => {
	return latestData?.cid && timelineData ? latestData.cid !== timelineData.pages[0].cid : false;
};

//// Raw fetch
const fetchPage = async (
	rpc: BskyXRPC,
	params: TimelineParams,
	limit: number,
	cursor: string | undefined,
	signal: AbortSignal,
): Promise<AppBskyFeedGetTimeline.Output> => {
	const type = params.type;

	if (type === 'following') {
		const response = await rpc.get('app.bsky.feed.getTimeline', {
			signal: signal,
			params: {
				algorithm: 'reverse-chronological',
				cursor: cursor,
				limit: limit,
			},
		});

		return response.data;
	} else if (type === 'feed') {
		const response = await rpc.get('app.bsky.feed.getFeed', {
			signal: signal,
			headers: {
				'accent-language': navigator.languages.join(','),
			},
			params: {
				feed: params.uri,
				cursor: cursor,
				limit: limit,
			},
		});

		return response.data;
	} else if (type === 'list') {
		const response = await rpc.get('app.bsky.feed.getListFeed', {
			signal: signal,
			params: {
				list: params.uri,
				cursor: cursor,
				limit: limit,
			},
		});

		return response.data;
	} else if (type === 'profile') {
		if (params.tab === 'likes') {
			const response = await rpc.get('app.bsky.feed.getActorLikes', {
				signal: signal,
				params: {
					actor: params.actor,
					cursor: cursor,
					limit: limit,
				},
			});

			return response.data;
		} else {
			const response = await rpc.get('app.bsky.feed.getAuthorFeed', {
				signal: signal,
				params: {
					actor: params.actor,
					cursor: cursor,
					limit: limit,
					filter:
						params.tab === 'media'
							? 'posts_with_media'
							: params.tab === 'replies'
								? 'posts_with_replies'
								: 'posts_and_author_threads',
				},
			});

			return response.data;
		}
	} else if (type === 'search') {
		const response = await rpc.get('app.bsky.feed.searchPosts', {
			signal: signal,
			params: {
				sort: 'latest',
				q: params.query,
				cursor: cursor,
				limit: limit,
			},
		});

		const data = response.data;

		return { cursor: data.cursor, feed: data.posts.map((view) => ({ post: view })) };
	} else {
		assert(false, `Unknown type: ${type}`);
	}
};

/// Timeline filters
type FilterFn<T> = (data: T) => boolean;

const combine = <T>(filters: Array<undefined | false | FilterFn<T>>): FilterFn<T> | undefined => {
	const filtered = filters.filter((filter): filter is FilterFn<T> => !!filter);
	const len = filtered.length;

	// if (len === 1) {
	// 	return filtered[0];
	// }

	// if (len === 0) {
	// 	return;
	// }

	return (data: T) => {
		for (let idx = 0; idx < len; idx++) {
			const filter = filtered[idx];

			if (!filter(data)) {
				return false;
			}
		}

		return true;
	};
};

//// Post filters
const createDuplicatePostFilter = (): PostFilter => {
	const map: Record<string, boolean> = {};

	return (item) => {
		const uri = item.post.uri;

		if (map[uri]) {
			return false;
		}

		return (map[uri] = true);
	};
};

const createInvalidReplyFilter = (): PostFilter => {
	return (item) => {
		// Don't allow posts that isn't being a hydrated with a reply when it should
		return (
			// Allow reposts
			item.reason?.$type === 'app.bsky.feed.defs#reasonRepost' ||
			// Allow posts with a timeline reply attached
			item.reply?.parent !== undefined ||
			// Allow posts whose record doesn't have the reply object
			(item.post.record as PostRecord).reply === undefined
		);
	};
};

const createLabelPostFilter = (opts: ModerationOptions): PostFilter | undefined => {
	return (item) => {
		const post = item.post;

		const author = post.author;
		const record = post.record as PostRecord;

		const isFollowing = !!author.viewer?.following;
		const text = record.text + unwrapPostEmbedText(record.embed);

		record.embed;

		const accu: ModerationCause[] = [];
		decideLabelModeration(accu, TargetContent, post.labels, post.author.did, opts);
		decideMutedKeywordModeration(accu, text, isFollowing, PreferenceHide, opts);

		const decision = getModerationUI(accu, ContextContentList);

		return decision.f.length === 0;
	};
};

const createHiddenRepostFilter = (opts: ModerationOptions): PostFilter | undefined => {
	const hidden = opts.preferences.hideReposts;

	if (hidden.length === 0) {
		return;
	}

	return (item) => {
		const reason = item.reason;

		return !reason || reason.$type !== 'app.bsky.feed.defs#reasonRepost' || !hidden.includes(reason.by.did);
	};
};

const createTempMutePostFilter = (uid: At.DID, opts: ModerationOptions): PostFilter | undefined => {
	// We won't be checking if any of the temporary mutes are stale, those should
	// be handled within the UI.
	const mutes = opts.preferences.tempMutes;
	const hasMutes = Object.keys(mutes).length !== 0;

	if (!hasMutes) {
		return;
	}

	return (item) => {
		const reason = item.reason;

		if (reason) {
			const did = reason.by.did;

			if (did !== uid && did in mutes) {
				return false;
			}
		}

		const did = item.post.author.did;

		if (did !== uid && did in mutes) {
			return false;
		}

		return true;
	};
};

const createHideRepliesFilter = (): PostFilter => {
	return (item) => {
		const reason = item.reason;

		return (
			// Allow reposts
			(reason !== undefined && reason.$type === 'app.bsky.feed.defs#reasonRepost') ||
			// Allow posts that aren't a reply
			(item.reply === undefined && (item.post.record as PostRecord).reply === undefined)
		);
	};
};

const createHideRepostsFilter = (): PostFilter => {
	return (item) => {
		const reason = item.reason;

		// Allow posts with no reason, or the reasoning isn't a repost.
		return reason === undefined || reason.$type !== 'app.bsky.feed.defs#reasonRepost';
	};
};

const createHideQuotesFilter = (): PostFilter => {
	return (item) => {
		const post = item.post.record as PostRecord;
		const record = getRecordEmbed(post.embed);

		return record === undefined || parseAtUri(record.record.uri).collection === 'app.bsky.feed.post';
	};
};

const createHideQuotesFromMutedFilter = (): PostFilter => {
	return (item) => {
		const post = item.post;
		const record = getRecordEmbedView(post.embed);

		return (
			record === undefined ||
			record.$type !== 'app.bsky.embed.record#viewRecord' ||
			!record.author.viewer?.muted
		);
	};
};

//// Slice filters
const createFeedSliceFilter = (): SliceFilter | undefined => {
	return (slice) => {
		const items = slice.items;
		const first = items[0];

		const reply = first.reply;

		// Skip any posts that are in reply to a muted user
		if (reply) {
			for (const author of getReplyAuthors(reply)) {
				if (!author) {
					continue;
				}

				const viewer = author.viewer;

				if (!viewer) {
					// If this one doesn't have viewer state then none of them does.
					break;
				}

				if (viewer.muted) {
					return yankReposts(items);
				}
			}
		}

		return true;
	};
};

const createHomeSliceFilter = (uid: At.DID, followsOnly: boolean): SliceFilter | undefined => {
	return (slice) => {
		const items = slice.items;
		const first = items[0];

		const reply = first.reply;
		const reason = first.reason;

		// Skip any posts that are in reply to non-followed user or a muted user
		if (reply && (!reason || reason.$type !== 'app.bsky.feed.defs#reasonRepost')) {
			for (const author of getReplyAuthors(reply)) {
				if (!author) {
					continue;
				}

				const viewer = author.viewer;

				if (!viewer) {
					// If this one doesn't have viewer state then none of them does.
					break;
				}

				if (author.did !== uid && ((followsOnly && !viewer.following) || !!viewer.muted)) {
					return yankReposts(items);
				}
			}
		}

		return true;
	};
};

const createProfileSliceFilter = (did: At.DID): SliceFilter | undefined => {
	return (slice) => {
		const items = slice.items;
		const first = items[0];

		const reply = first.reply;
		const reason = first.reason;

		// Skip any posts that doesn't seem to look like a self-thread
		if (reply && (!reason || reason.$type !== 'app.bsky.feed.defs#reasonRepost')) {
			for (const author of getReplyAuthors(reply)) {
				if (!author) {
					continue;
				}

				if (author.did !== did) {
					return yankReposts(items);
				}
			}
		}

		return true;
	};
};

// Get the reposts out of the gutter
const yankReposts = (items: EnsuredTimelineItem[]): TimelineSlice[] | false => {
	let slices: TimelineSlice[] | false = false;
	let last: EnsuredTimelineItem[] | undefined;

	for (let idx = 0, len = items.length; idx < len; idx++) {
		const item = items[idx];
		const reason = item.reason;

		if (reason && reason.$type === 'app.bsky.feed.defs#reasonRepost') {
			if (last) {
				last.push(item);
			} else {
				(slices ||= []).push({ items: (last = [item]) });
			}
		} else {
			last = undefined;
		}
	}

	return slices;
};

const getReplyAuthors = (reply: EnsuredReplyRef) => {
	return [reply.root?.author, reply.grandparentAuthor, reply.parent?.author];
};

const getRecordEmbed = (embed: PostRecord['embed']): AppBskyEmbedRecord.Main | undefined => {
	if (embed) {
		if (embed.$type === 'app.bsky.embed.record') {
			return embed;
		}

		if (embed.$type === 'app.bsky.embed.recordWithMedia') {
			return embed.record;
		}
	}
};

const getRecordEmbedView = (embed: AppBskyFeedDefs.PostView['embed']) => {
	if (embed) {
		if (embed.$type === 'app.bsky.embed.record#view') {
			return embed.record;
		}

		if (embed.$type === 'app.bsky.embed.recordWithMedia#view') {
			return embed.record.record;
		}
	}
};
