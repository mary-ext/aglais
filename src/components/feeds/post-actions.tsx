import type { AppBskyFeedDefs } from '@mary/bluesky-client/lexicons';

import { type PostShadowView } from '~/api/cache/post-shadow';
import { createPostLikeMutation, createPostRepostMutation } from '~/api/mutations/post';

import { openModal } from '~/globals/modals';

import { formatCompact } from '~/lib/intl/number';

import ComposerDialogLazy from '../composer/composer-dialog-lazy';
import HeartOutlinedIcon from '../icons-central/heart-outline';
import HeartSolidIcon from '../icons-central/heart-solid';
import RepeatOutlinedIcon from '../icons-central/repeat-outline';
import ReplyOutlinedIcon from '../icons-central/reply-outline';
import ShareOutlinedIcon from '../icons-central/share-outline';

import RepostMenu from './repost-menu';

export interface PostActionsProps {
	/** Not static, but expects the URI (post identifier) to be static */
	post: AppBskyFeedDefs.PostView;
	shadow: PostShadowView;
	/** Expected to be static */
	compact?: boolean;
}

const PostActions = (props: PostActionsProps) => {
	const post = () => props.post;
	const shadow = () => props.shadow;
	const compact = props.compact;

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
		<div class={`mt-3 flex items-center text-contrast-muted` + (!compact ? ` gap-2` : ` gap-3`)}>
			<div class={`min-w-0` + (!compact ? ` grow basis-0` : ``)}>
				<button
					onClick={() => {
						if (replyDisabled()) {
							return;
						}

						const $post = post();
						openModal(() => <ComposerDialogLazy params={{ reply: $post }} />);
					}}
					class={`group flex max-w-full grow basis-0 items-end gap-0.5 hover:text-accent`}
				>
					<div class="-my-1.5 -ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base group-hover:bg-accent/md group-active:bg-accent/md-pressed">
						<ReplyOutlinedIcon />
					</div>

					<span class="overflow-hidden text-ellipsis whitespace-nowrap pr-2 text-de">
						{!compact ? formatCompact(post().replyCount ?? 0) : `Reply`}
					</span>
				</button>
			</div>

			<div class={`min-w-0` + (!compact ? ` grow basis-0` : ``)}>
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
						`group flex max-w-full grow basis-0 items-end gap-0.5` +
						(isReposted() ? ` text-repost` : ` hover:text-repost`)
					}
				>
					<div class="-my-1.5 -ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base group-hover:bg-repost/md group-active:bg-repost/md-pressed">
						<RepeatOutlinedIcon />
					</div>

					<span class="overflow-hidden text-ellipsis whitespace-nowrap pr-2 text-de">
						{formatCompact(props.shadow.repostCount)}
					</span>
				</button>
			</div>

			<div class={`min-w-0` + (!compact ? ` grow basis-0` : ``)}>
				<button
					onClick={toggleLike}
					class={
						`group flex max-w-full grow basis-0 items-end gap-0.5` +
						(isLiked() ? ` text-like` : ` hover:text-like`)
					}
				>
					<div class="-my-1.5 -ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base group-hover:bg-like/md group-active:bg-like/md-pressed">
						{(() => {
							const Icon = !isLiked() ? HeartOutlinedIcon : HeartSolidIcon;
							return <Icon />;
						})()}
					</div>

					<span class="overflow-hidden text-ellipsis whitespace-nowrap pr-2 text-de">
						{formatCompact(props.shadow.likeCount)}
					</span>
				</button>
			</div>

			<div class="shrink-0">
				<button class="-mx-2 -my-1.5 flex h-8 w-8 items-center justify-center rounded-full text-base hover:bg-accent/md hover:text-accent active:bg-accent/md-pressed">
					<ShareOutlinedIcon />
				</button>
			</div>
		</div>
	);
};

export default PostActions;
