import { type Component, type ComponentProps, type JSX, createMemo } from 'solid-js';

import type {
	AppBskyEmbedImages,
	AppBskyFeedDefs,
	AppBskyFeedPost,
	AppBskyNotificationListNotifications,
} from '@atcute/client/lexicons';
import { useQueryClient } from '@mary/solid-query';

import { moderateProfile } from '~/api/moderation/entities/profile';
import { precacheProfile } from '~/api/queries-cache/profile-precache';
import type {
	FollowNotificationSlice,
	LikeNotificationSlice,
	NotificationSlice,
	RepostNotificationSlice,
} from '~/api/queries/notification-feed';
import { parseAtUri } from '~/api/utils/strings';

import { history } from '~/globals/navigation';

import { INTERACTION_TAGS, isElementAltClicked, isElementClicked } from '~/lib/interaction';
import { useModerationOptions } from '~/lib/states/moderation';
import { useSession } from '~/lib/states/session';
import { assert } from '~/lib/utils/invariant';

import Avatar, { getUserAvatarType } from '../avatar';
import { type BlueskyGifSnippet, SnippetType, detectSnippet } from '../embeds/lib/snippet';
import HeartSolidIcon from '../icons-central/heart-solid';
import PersonSolidIcon from '../icons-central/person-solid';
import RepeatOutlinedIcon from '../icons-central/repeat-outline';
import PostFeedItem from '../timeline/post-feed-item';

export interface NotificationItemProps {
	/** Expected to be static */
	item: NotificationSlice;
}

// How many names to show before considering truncation
const MAX_NAMES = 2;

// How many names to show after truncation
const MAX_NAMES_AFTER_TRUNCATION = 1;

// How many avatars to show before considering truncation
const MAX_AVATARS = 6;

const NotificationItem = ({ item }: NotificationItemProps) => {
	const queryClient = useQueryClient();
	const { currentAccount } = useSession();

	const type = item.type;
	const read = item.read;

	if (type === 'follow' || type === 'like' || type === 'repost') {
		let Icon: Component<ComponentProps<'svg'>>;
		let iconClass: string = '';

		if (type === 'follow') {
			Icon = PersonSolidIcon;
			iconClass = `text-accent`;
		} else if (type === 'like') {
			Icon = HeartSolidIcon;
			iconClass = `text-like`;
		} else if (type === 'repost') {
			Icon = RepeatOutlinedIcon;
			iconClass = `text-repost`;
		} else {
			assert(false, `Unexpected code reach`);
		}

		const handleClick = (ev: MouseEvent | KeyboardEvent) => {
			if (!isElementClicked(ev, INTERACTION_TAGS)) {
				return;
			}

			let href: string;
			if (type === 'follow') {
				const notifs = item.items;

				if (notifs.length === 1) {
					const profile = notifs[0].author;

					href = `/${profile.did}`;
					precacheProfile(queryClient, profile);
				} else {
					href = `/${currentAccount!.did}/followers`;
				}
			} else {
				const post = item.view;
				const uri = parseAtUri(post.uri);
				href = `/${uri.repo}/${uri.rkey}`;
			}

			if (isElementAltClicked(ev)) {
				window.open(href, '_blank');
			} else {
				history.navigate(href);
			}
		};

		return (
			<div
				tabindex={0}
				onClick={handleClick}
				onAuxClick={handleClick}
				onKeyDown={handleClick}
				class={
					`relative flex gap-3 border-b border-outline px-4 py-3` +
					(read ? ` hover:bg-contrast/sm` : ` bg-accent/15 hover:bg-accent/md`)
				}
			>
				<div class="flex w-9 shrink-0 flex-col items-end">
					<div class="grid h-8 w-8 place-items-center">
						<Icon class={`h-6 w-6 ` + iconClass} />
					</div>
				</div>
				<div class="flex min-w-0 grow flex-col gap-3">
					{/* @once */ renderAvatars(item.items)}
					<div class="overflow-hidden break-words text-sm">{/* @once */ renderText(item)}</div>
					{/* @once */ renderAccessory(item)}
				</div>
			</div>
		);
	}

	if (type === 'mention' || type === 'quote' || type === 'reply') {
		const view = item.view;

		return (
			<PostFeedItem
				highlighted={!read}
				item={{
					post: view,
					reply: undefined,
					reason: undefined,
					next: false,
					prev: false,
				}}
			/>
		);
	}

	return null;
};

export default NotificationItem;

const renderAvatars = (notifs: AppBskyNotificationListNotifications.Notification[]) => {
	const queryClient = useQueryClient();
	const moderationOptions = useModerationOptions();

	const avatars = notifs.slice(0, MAX_AVATARS).map(({ author }) => {
		const { did, avatar, displayName, handle } = author;
		const moderation = createMemo(() => moderateProfile(author, moderationOptions()));

		return (
			<Avatar
				type={/* @once */ getUserAvatarType(author)}
				title={displayName ? `${displayName} (@${handle})` : `@${handle}`}
				src={avatar}
				href={`/${did}`}
				onClick={() => precacheProfile(queryClient, author)}
				moderation={moderation()}
				size="in"
			/>
		);
	});

	return <div class="flex items-center gap-2">{avatars}</div>;
};

const renderText = (data: FollowNotificationSlice | LikeNotificationSlice | RepostNotificationSlice) => {
	const queryClient = useQueryClient();

	const items = data.items;
	const sliced = Math.min(items.length, items.length > MAX_NAMES ? MAX_NAMES_AFTER_TRUNCATION : MAX_NAMES);
	const remaining = items.length - sliced;

	const type = data.type;

	const nodes: JSX.Element[] = [];

	for (let idx = 0; idx < sliced; idx++) {
		const item = items[idx];
		const author = item.author;

		if (sliced > 1) {
			if (remaining < 1 && idx === sliced - 1) {
				nodes.push(` and `);
			} else if (idx !== 0) {
				nodes.push(`, `);
			}
		}

		nodes.push(
			<a
				dir="auto"
				href={/* @once */ `/${author.did}`}
				onClick={() => precacheProfile(queryClient, author)}
				class="inline-block overflow-hidden align-top font-bold hover:underline"
			>
				{/* @once */ author.displayName?.trim() || `@${author.handle}`}
			</a>,
		);
	}

	if (remaining > 0) {
		nodes.push(` and ${remaining} others`);
	}

	if (type === 'follow') {
		nodes.push(` followed you`);
	} else if (type === 'like') {
		nodes.push(` liked your post`);
	} else if (type === 'repost') {
		nodes.push(` reposted your post`);
	}

	return nodes;
};

const renderAccessory = (data: FollowNotificationSlice | LikeNotificationSlice | RepostNotificationSlice) => {
	const type = data.type;

	if (type === 'like' || type === 'repost') {
		const post = data.view;
		const record = post.record as AppBskyFeedPost.Record;

		const imageEmbed = getImageEmbed(post.embed);
		const gifEmbed = getGifEmbed(post.embed);

		return (
			<>
				<p class="whitespace-pre-wrap break-words text-sm text-contrast-muted empty:hidden">
					{/* @once */ record.text}
				</p>

				{imageEmbed ? (
					<ImageAccessory images={/* @once */ imageEmbed.images} />
				) : gifEmbed ? (
					<GifAccessory snippet={gifEmbed} />
				) : null}
			</>
		);
	}
};

const ImageAccessory = ({ images }: { images: AppBskyEmbedImages.ViewImage[] }) => {
	const nodes = images.map((img) => {
		return (
			<div class="shrink-0 overflow-hidden rounded bg-background">
				<img src={/* @once */ img.fullsize} class="h-32 w-32 object-cover opacity-75" />
			</div>
		);
	});

	return <div class="-ml-16 -mr-4 flex gap-2 overflow-x-auto pl-16 pr-4 scrollbar-hide">{nodes}</div>;
};

const GifAccessory = ({ snippet }: { snippet: BlueskyGifSnippet }) => {
	return (
		<div class="relative w-max shrink-0 overflow-hidden rounded bg-background">
			<div class="opacity-75">
				<img src={/* @once */ snippet.thumb} class="h-32 w-32 object-cover" />

				<div class="pointer-events-none absolute bottom-0 right-0 p-2">
					<div class="flex h-4 items-center rounded bg-p-neutral-950/75 px-1 text-[9px] font-bold tracking-wider text-white">
						GIF
					</div>
				</div>
			</div>
		</div>
	);
};

const getImageEmbed = (embed: AppBskyFeedDefs.PostView['embed']) => {
	if (embed) {
		if (embed.$type === 'app.bsky.embed.recordWithMedia#view') {
			return getImageEmbed(embed.media);
		}

		if (embed.$type === 'app.bsky.embed.images#view') {
			return embed;
		}
	}
};

const getGifEmbed = (embed: AppBskyFeedDefs.PostView['embed']): BlueskyGifSnippet | undefined => {
	if (embed) {
		if (embed.$type === 'app.bsky.embed.recordWithMedia#view') {
			return getGifEmbed(embed.media);
		}

		if (embed.$type === 'app.bsky.embed.external#view') {
			const snippet = detectSnippet(embed.external);
			if (snippet.type !== SnippetType.BLUESKY_GIF) {
				return;
			}

			return snippet;
		}
	}
};
