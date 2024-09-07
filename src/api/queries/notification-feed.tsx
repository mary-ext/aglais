import { createSignal } from 'solid-js';

import type { AppBskyFeedDefs, AppBskyNotificationListNotifications } from '@atcute/client/lexicons';
import { createInfiniteQuery, useQueryClient, type QueryFunctionContext as QC } from '@mary/solid-query';

import { mapDefined } from '~/lib/utils/misc';
import { useAgent } from '~/lib/states/agent';

import { dequal } from '../utils/dequal';
import { resetInfiniteData } from '../utils/query';
import { parseAtUri } from '../utils/strings';
import { chunked } from '../utils/misc';

type Notification = AppBskyNotificationListNotifications.Notification;

export interface FollowNotificationSlice {
	type: 'follow';
	read: boolean;
	date: number;
	items: Notification[];
}

export interface LikeNotificationSlice {
	type: 'like';
	read: boolean;
	key: string;
	date: number;
	items: Notification[];
	view: AppBskyFeedDefs.PostView;
}

export interface MentionNotificationSlice {
	type: 'mention';
	read: boolean;
	date: number;
	view: AppBskyFeedDefs.PostView;
	item: Notification;
}

export interface QuoteNotificationSlice {
	type: 'quote';
	read: boolean;
	date: number;
	view: AppBskyFeedDefs.PostView;
	item: Notification;
}

export interface ReplyNotificationSlice {
	type: 'reply';
	read: boolean;
	date: number;
	view: AppBskyFeedDefs.PostView;
	item: Notification;
}

export interface RepostNotificationSlice {
	type: 'repost';
	read: boolean;
	key: string;
	date: number;
	view: AppBskyFeedDefs.PostView;
	items: Notification[];
}

export type NotificationSlice =
	| FollowNotificationSlice
	| LikeNotificationSlice
	| MentionNotificationSlice
	| QuoteNotificationSlice
	| ReplyNotificationSlice
	| RepostNotificationSlice;

export interface NotifPageParam {
	cursor: string;
	seenAt: number;
}

export interface NotificationFeedReturn {
	param: NotifPageParam | undefined;
	slices: NotificationSlice[];
}

const MAX_MERGE_TIME = 6 * 60 * 60 * 1_000;

export const createNotificationFeedQuery = () => {
	const { rpc } = useAgent();
	const queryClient = useQueryClient();

	const [firstFetchedAt, setFirstFetchedAt] = createSignal(0);

	const feed = createInfiniteQuery(() => ({
		queryKey: ['notification', 'feed'],
		async queryFn({
			signal,
			pageParam,
		}: QC<never, NotifPageParam | undefined>): Promise<NotificationFeedReturn> {
			const { data } = await rpc.get('app.bsky.notification.listNotifications', {
				signal: signal,
				params: {
					limit: 40,
					cursor: pageParam?.cursor,
				},
			});

			const notifs = data.notifications;
			const firstSeenAt = pageParam?.seenAt;

			// Notifications query doesn't return a hydrated post view, we'll need to
			// retrieve them here.
			let posts: Map<string, AppBskyFeedDefs.PostView>;

			{
				const postUris = new Set(
					mapDefined(notifs, (item) => {
						const reason = item.reason;

						if (reason === 'like' || reason === 'repost') {
							const subjectUri = item.reasonSubject;

							// skip if they're not related to posts.
							if (!subjectUri || parseAtUri(subjectUri).collection !== 'app.bsky.feed.post') {
								return;
							}

							return subjectUri;
						} else if (reason === 'reply' || reason === 'quote' || reason === 'mention') {
							return item.uri;
						}
					}),
				);

				const chunkedPosts = await Promise.all(
					chunked(Array.from(postUris), 25).map(async (uris) => {
						const { data } = await rpc.get('app.bsky.feed.getPosts', {
							params: {
								uris: uris,
							},
						});

						return data.posts;
					}),
				);

				posts = new Map(chunkedPosts.flatMap((chunk) => chunk.map((post) => [post.uri, post])));
			}

			// Group these notifications into slices
			const slices: NotificationSlice[] = [];
			let slen = 0;

			loop: for (let i = notifs.length - 1; i >= 0; i--) {
				const item = notifs[i];

				const reason = item.reason as 'like' | 'repost' | 'follow' | 'mention' | 'reply' | 'quote';
				const date = new Date(item.indexedAt).getTime();
				const read = firstSeenAt === undefined ? item.isRead : firstSeenAt > date;

				if (!read) {
					hasUnread = true;
				}

				if (reason === 'follow') {
					for (let j = 0; j < slen; j++) {
						const slice = slices[j];

						if (slice.type !== reason || slice.read !== read) {
							continue;
						}

						if (date - slice.date <= MAX_MERGE_TIME) {
							slice.items.unshift(item);

							if (j !== 0) {
								slices.splice(j, 1);
								slices.unshift(slice);
							}

							continue loop;
						}
					}

					slen++;
					slices.unshift({ type: reason, read, date, items: [item] });
				} else if (reason === 'like' || reason === 'repost') {
					const key = item.reasonSubject!;
					const view = posts.get(key);

					if (!view) {
						continue;
					}

					for (let j = 0; j < slen; j++) {
						const slice = slices[j];

						if (slice.type !== reason || slice.read !== read || slice.key !== key) {
							continue;
						}

						if (date - slice.date <= MAX_MERGE_TIME) {
							slice.items.unshift(item);

							if (j !== 0) {
								slices.splice(j, 1);
								slices.unshift(slice);
							}

							continue loop;
						}
					}

					slen++;
					slices.unshift({ type: reason, read, key, date, view, items: [item] });
				} else if (reason === 'reply' || reason === 'quote' || reason === 'mention') {
					const view = posts.get(item.uri);

					if (!view) {
						continue;
					}

					slen++;
					slices.unshift({ type: reason, read, date, view, item });
				}
			}

			if (pageParam === undefined) {
				const now = Date.now();

				setFirstFetchedAt(now);

				{
					const indexedAt = new Date(notifs[0]?.indexedAt ?? 0).getTime();
					const seenAt = Math.max(now, indexedAt);

					const promise = rpc.call('app.bsky.notification.updateSeen', {
						data: {
							seenAt: new Date(seenAt).toISOString(),
						},
					});

					queryClient.cancelQueries({
						exact: true,
						queryKey: ['notification', 'count'],
					});

					promise.finally(() => {
						queryClient.setQueryData(['notification', 'count'], { count: 0 });
					});
				}
			}

			return {
				param: data.cursor
					? {
							cursor: data.cursor,
							seenAt: pageParam?.seenAt ?? (data.seenAt ? new Date(data.seenAt).getTime() : Date.now()),
						}
					: undefined,
				slices: slices,
			};
		},
		initialPageParam: undefined,
		getNextPageParam: (last) => last.param,
		staleTime: Infinity,
		structuralSharing(a: any, b: any) {
			if (!a) {
				return b;
			}

			if (!dequal(a.pages, b.pages)) {
				return b;
			}

			return a;
		},
	}));

	const reset = async () => {
		resetInfiniteData(queryClient, ['notification', 'feed']);
		await feed.refetch();
	};

	return { feed, reset, firstFetchedAt };
};
