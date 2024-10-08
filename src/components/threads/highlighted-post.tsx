import { Show, createMemo } from 'solid-js';

import type { AppBskyFeedDefs, AppBskyFeedPost } from '@atcute/client/lexicons';

import { usePostShadow } from '~/api/cache/post-shadow';
import { getModerationUI } from '~/api/moderation';
import { ContextContentView } from '~/api/moderation/constants';
import { moderatePost } from '~/api/moderation/entities/post';
import { createPostLikeMutation, createPostRepostMutation } from '~/api/mutations/post';
import { parseAtUri } from '~/api/utils/strings';

import { openModal } from '~/globals/modals';

import { formatCompact } from '~/lib/intl/number';
import { useModerationOptions } from '~/lib/states/moderation';

import Avatar, { getUserAvatarType } from '../avatar';
import ComposerDialogLazy from '../composer/composer-dialog-lazy';
import Divider from '../divider';
import Embed from '../embeds/embed';
import HeartOutlinedIcon from '../icons-central/heart-outline';
import HeartSolidIcon from '../icons-central/heart-solid';
import MoreHorizOutlinedIcon from '../icons-central/more-horiz-outline';
import RepeatOutlinedIcon from '../icons-central/repeat-outline';
import ReplyOutlinedIcon from '../icons-central/reply-outline';
import ShareOutlinedIcon from '../icons-central/share-outline';
import ContentHider from '../moderation/content-hider';
import ModerationAlerts from '../moderation/moderation-alerts';
import RichText from '../rich-text';
import TimeAgo from '../time-ago';
import PostOverflowMenu from '../timeline/post-overflow-menu';
import RepostMenu from '../timeline/repost-menu';

export interface HighlightedPostProps {
	post: AppBskyFeedDefs.PostView;
	/** Expected to be static */
	prev?: boolean;
	onPostDelete?: () => void;
	onReplyPublish?: () => void;
}

const HighlightedPost = (props: HighlightedPostProps) => {
	const post = () => props.post;

	const moderationOptions = useModerationOptions();

	const author = () => post().author;
	const record = () => post().record as AppBskyFeedPost.Record;
	const embed = () => post().embed;

	const shadow = usePostShadow(post);

	const uri = parseAtUri(post().uri);
	const did = author().did;

	const authorHref = `/${did}`;
	const href = `/${did}/${uri.rkey}`;

	const moderation = createMemo(() => moderatePost(post(), moderationOptions()));
	const ui = createMemo(() => getModerationUI(moderation(), ContextContentView));

	const mutateLike = createPostLikeMutation(post, shadow);
	const mutateRepost = createPostRepostMutation(post, shadow);

	const replyDisabled = () => post().viewer?.replyDisabled;
	const isLiked = () => !!shadow().likeUri;
	const isReposted = () => !!shadow().repostUri;

	const toggleLike = () => {
		mutateLike(!isLiked());
	};

	const toggleRepost = () => {
		mutateRepost(!isReposted());
	};

	return (
		<div class="px-4 pt-3">
			<div class="relative mb-3 flex items-center justify-between gap-3 text-sm text-contrast-muted">
				{props.prev && (
					<div class="absolute bottom-full mb-1 flex h-3 w-9 flex-col items-center">
						<div class="grow border-l-2 border-outline-md" />
					</div>
				)}

				<a href={authorHref} class="inline-flex min-w-0 max-w-full items-center">
					<Avatar
						type={/* @once */ getUserAvatarType(author())}
						src={author().avatar}
						moderation={moderation()}
					/>

					<p class="ml-3 mr-2 overflow-hidden text-ellipsis">
						<span class="font-semibold text-contrast">{author().handle}</span>
					</p>

					<TimeAgo value={post().indexedAt}>
						{(relative, absolute) => (
							<a title={absolute()} href={href} class="whitespace-nowrap hover:underline">
								{relative()}
							</a>
						)}
					</TimeAgo>
				</a>

				<div class="flex shrink-0 items-center gap-4">
					<button
						onClick={(ev) => {
							const anchor = ev.currentTarget;
							const $post = post();
							const onPostDelete = props.onPostDelete;

							openModal(() => <PostOverflowMenu anchor={anchor} post={$post} onPostDelete={onPostDelete} />);
						}}
						class="-mx-2 -my-1.5 flex h-8 w-8 items-center justify-center rounded-full text-base hover:bg-accent/md hover:text-accent active:bg-accent/md-pressed"
					>
						<MoreHorizOutlinedIcon />
					</button>
				</div>
			</div>

			<ModerationAlerts ui={ui()} large class="mb-1" />

			<ContentHider ui={ui()} ignoreMute containerClass="mt-3" innerClass="mt-2">
				<RichText text={record().text} facets={record().facets} large />
				{embed() && <Embed embed={embed()!} large moderation={moderation()} gutterTop />}
			</ContentHider>

			<div class="mt-4 flex flex-wrap gap-4 border-t border-outline py-4 empty:hidden">
				<StatItem count={shadow().repostCount} label="Reposts" href={`${href}/reposts`} />
				<StatItem count={post().quoteCount ?? 0} label="Quotes" href={`${href}/quotes`} />
				<StatItem count={shadow().likeCount} label="Likes" href={`${href}/likes`} />
			</div>

			<Divider />

			<div class="flex h-13 items-center justify-around text-contrast-muted">
				<button
					onClick={() => {
						if (replyDisabled()) {
							return;
						}

						const $post = post();
						const onPublishReply = props.onReplyPublish;
						openModal(() => <ComposerDialogLazy params={{ reply: $post }} onPublish={onPublishReply} />);
					}}
					class={`flex h-9 w-9 items-center justify-center rounded-full text-xl hover:bg-accent/md hover:text-accent active:bg-accent/md-pressed`}
				>
					<ReplyOutlinedIcon />
				</button>

				<button
					onClick={(ev) => {
						const anchor = ev.currentTarget;

						openModal(() => (
							<RepostMenu
								anchor={anchor}
								isReposted={isReposted()}
								onQuote={() => {
									const $post = post();
									openModal(() => <ComposerDialogLazy params={{ quote: $post }} />);
								}}
								onRepost={toggleRepost}
							/>
						));
					}}
					class={
						`flex h-9 w-9 items-center justify-center rounded-full text-xl hover:bg-repost/md active:bg-repost/md-pressed` +
						(isReposted() ? ` text-repost` : ` hover:text-repost`)
					}
				>
					<RepeatOutlinedIcon />
				</button>

				<button
					onClick={toggleLike}
					class={
						`flex h-9 w-9 items-center justify-center rounded-full text-xl hover:bg-like/md active:bg-like/md-pressed` +
						(isLiked() ? ` text-like` : ` hover:text-like`)
					}
				>
					{(() => {
						const Icon = !isLiked() ? HeartOutlinedIcon : HeartSolidIcon;
						return <Icon />;
					})()}
				</button>

				<button
					class={`flex h-9 w-9 items-center justify-center rounded-full text-xl hover:bg-accent/md hover:text-accent active:bg-accent/md-pressed`}
				>
					<ShareOutlinedIcon />
				</button>
			</div>
		</div>
	);
};

export default HighlightedPost;

const StatItem = (props: { count: number; label: string; href: string }) => {
	return (
		<Show when={props.count > 0}>
			<a href={props.href} class="text-sm hover:underline">
				<span class="font-bold">{formatCompact(props.count)}</span>
				<span class="text-contrast-muted"> {props.label}</span>
			</a>
		</Show>
	);
};
