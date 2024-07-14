import { createMemo } from 'solid-js';

import type { AppBskyFeedDefs, AppBskyFeedPost } from '@mary/bluesky-client/lexicons';

import { usePostShadow } from '~/api/cache/post-shadow';
import { useProfileShadow } from '~/api/cache/profile-shadow';
import { ContextContentView, getModerationUI } from '~/api/moderation';
import { moderatePost } from '~/api/moderation/entities/post';
import { createPostLikeMutation, createPostRepostMutation } from '~/api/mutations/post';
import { EQUALS_DEQUAL } from '~/api/utils/dequal';
import { parseAtUri } from '~/api/utils/strings';

import { openModal } from '~/globals/modals';

import { formatCompact } from '~/lib/intl/number';
import { formatAbsDateTime } from '~/lib/intl/time';
import { useModerationOptions } from '~/lib/states/moderation';

import Avatar from '../avatar';
import Divider from '../divider';
import HeartOutlinedIcon from '../icons-central/heart-outline';
import HeartSolidIcon from '../icons-central/heart-solid';
import MoreHorizOutlinedIcon from '../icons-central/more-horiz-outline';
import RepeatOutlinedIcon from '../icons-central/repeat-outline';
import ReplyOutlinedIcon from '../icons-central/reply-outline';
import ShareOutlinedIcon from '../icons-central/share-outline';
import RichText from '../rich-text';

import ComposerDialogLazy from '../composer/composer-dialog-lazy';
import Embed from '../embeds/embed';
import PostOverflowMenu from '../feeds/post-overflow-menu';
import RepostMenu from '../feeds/repost-menu';
import ContentHider from '../moderation/content-hider';

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
	const authorShadow = useProfileShadow(author);

	const links = createMemo(() => {
		const uri = parseAtUri(post().uri);
		const did = author().did;

		const authorHref = `/${did}`;
		const href = `/${did}/${uri.rkey}`;

		return { authorHref, href };
	}, EQUALS_DEQUAL);

	const moderation = createMemo(() => moderatePost(post(), authorShadow(), moderationOptions()));

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

				<a href={links().authorHref} class="inline-flex min-w-0 max-w-full items-center gap-3">
					<Avatar
						type={author().associated?.labeler ? 'labeler' : 'user'}
						src={author().avatar}
						moderation={moderation()}
					/>

					<div class="max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
						<bdi class="overflow-hidden text-ellipsis">
							<span class="font-bold text-contrast hover:underline">{author().displayName}</span>
						</bdi>
						<p class="overflow-hidden text-ellipsis whitespace-nowrap">{'@' + author().handle}</p>
					</div>
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

			<ContentHider
				ui={getModerationUI(moderation(), ContextContentView)}
				ignoreMute
				containerClass="mt-3"
				innerClass="mt-2"
			>
				<RichText text={record().text} facets={record().facets} large />
				{embed() && <Embed embed={embed()!} moderation={moderation()} gutterTop />}
			</ContentHider>

			<p class="mt-3 text-sm text-contrast-muted">{formatAbsDateTime(post().indexedAt)}</p>

			<Divider gutterTop="md" />

			<div class="flex flex-wrap gap-4 py-4 text-sm">
				<a class="hover:underline">
					<span class="font-bold">{formatCompact(shadow().repostCount)}</span>
					<span class="text-contrast-muted"> Reposts</span>
				</a>

				<a class="hover:underline">
					<span class="font-bold">{formatCompact(shadow().likeCount)}</span>
					<span class="text-contrast-muted"> Likes</span>
				</a>
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
