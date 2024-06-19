import type { AppBskyFeedDefs } from '@mary/bluesky-client/lexicons';
import { useQueryClient } from '@mary/solid-query';

import { updatePostShadow, type PostShadowView } from '~/api/cache/post-shadow';

import { openModal } from '~/globals/modals';

import * as Menu from '../menu';
import HeartOutlinedIcon from '../icons-central/heart-outline';
import HeartSolidIcon from '../icons-central/heart-solid';
import RepeatOutlinedIcon from '../icons-central/repeat-outline';
import ReplyOutlinedIcon from '../icons-central/reply-outline';
import ShareOutlinedIcon from '../icons-central/share-outline';
import WriteOutlinedIcon from '../icons-central/write-outline';

export interface PostActionsProps {
	/** Expected to be static */
	post: AppBskyFeedDefs.PostView;
	shadow: PostShadowView;
	/** Expected to be static */
	compact?: boolean;
}

const PostActions = (props: PostActionsProps) => {
	const queryClient = useQueryClient();

	const post = props.post;
	const compact = props.compact;

	const replyCount = post.replyCount ?? 0;
	const isLiked = () => !!props.shadow.likeUri;
	const isReposted = () => !!props.shadow.repostUri;

	const toggleLike = () => {
		updatePostShadow(queryClient, post.uri, { likeUri: isLiked() ? undefined : `pending` });
	};

	const toggleRepost = () => {
		updatePostShadow(queryClient, post.uri, { repostUri: isReposted() ? undefined : `pending` });
	};

	return (
		<div class={`mt-3 flex items-center text-c-contrast-600` + (!compact ? `` : ` gap-3`)}>
			<div class={`min-w-0` + (!compact ? ` grow basis-0` : ``)}>
				<button class={`group flex max-w-full grow basis-0 items-end gap-0.5`}>
					<div class="-my-1.5 -ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base group-hover:bg-c-contrast-50">
						<ReplyOutlinedIcon />
					</div>

					<span class="overflow-hidden text-ellipsis whitespace-nowrap pr-2 text-de">
						{!compact ? replyCount : `Reply`}
					</span>
				</button>
			</div>

			<div class={`min-w-0` + (!compact ? ` grow basis-0` : ``)}>
				<button
					onClick={(ev) => {
						const anchor = ev.currentTarget;

						openModal(({ close }) => (
							<Menu.Container anchor={anchor} placement="bottom">
								<Menu.Item
									icon={RepeatOutlinedIcon}
									label={!isReposted() ? `Repost` : `Undo repost`}
									onClick={() => {
										close();
										toggleRepost();
									}}
								/>

								<Menu.Item
									icon={WriteOutlinedIcon}
									label="Quote"
									onClick={() => {
										close();
									}}
								/>
							</Menu.Container>
						));
					}}
					class={
						`group flex max-w-full grow basis-0 items-end gap-0.5` +
						(isReposted() ? ` text-c-positive-600` : ``)
					}
				>
					<div class="-my-1.5 -ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base group-hover:bg-c-contrast-50">
						<RepeatOutlinedIcon />
					</div>

					<span class="overflow-hidden text-ellipsis whitespace-nowrap pr-2 text-de">
						{props.shadow.repostCount}
					</span>
				</button>
			</div>

			<div class={`min-w-0` + (!compact ? ` grow basis-0` : ``)}>
				<button
					onClick={toggleLike}
					class={
						`group flex max-w-full grow basis-0 items-end gap-0.5` + (isLiked() ? ` text-c-negative-400` : ``)
					}
				>
					<div class="-my-1.5 -ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base group-hover:bg-c-contrast-50">
						{(() => {
							const Icon = !isLiked() ? HeartOutlinedIcon : HeartSolidIcon;
							return <Icon />;
						})()}
					</div>

					<span class="overflow-hidden text-ellipsis whitespace-nowrap pr-2 text-de">
						{props.shadow.likeCount}
					</span>
				</button>
			</div>

			<div class="shrink-0">
				<button class="-mx-2 -my-1.5 flex h-8 w-8 items-center justify-center rounded-full text-base hover:bg-c-contrast-50">
					<ShareOutlinedIcon />
				</button>
			</div>
		</div>
	);
};

export default PostActions;
