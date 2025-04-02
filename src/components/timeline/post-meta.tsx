import type { AppBskyFeedDefs } from '@atcute/client/lexicons';
import { useQueryClient } from '@mary/solid-query';

import { precacheProfile } from '~/api/queries-cache/profile-precache';

import { openModal } from '~/globals/modals';

import Avatar from '../avatar';
import HeartSolidIcon from '../icons-central/heart-solid';
import MoreHorizOutlinedIcon from '../icons-central/more-horiz-outline';
import TimeAgo from '../time-ago';

import PostOverflowMenu from './post-overflow-menu';

export interface PostMetaProps {
	/** Expected to be static */
	post: AppBskyFeedDefs.PostView;
	context?: AppBskyFeedDefs.ThreadContext;
	/** Expected to be static */
	authorHref: string;
	/** Expected to be static */
	href: string;
	/** Expected to be static */
	gutterBottom?: boolean;
	onPostDelete?: () => void;
	onPostRedraft?: () => void;
}

const PostMeta = (props: PostMetaProps) => {
	const queryClient = useQueryClient();

	const post = props.post;
	const href = props.href;
	const authorHref = props.authorHref;
	const gutterBottom = props.gutterBottom;

	const onPostDelete = props.onPostDelete;
	const onPostRedraft = props.onPostRedraft;

	const author = post.author;
	const indexedAt = post.indexedAt;

	return (
		<div
			class={`flex items-center justify-between gap-4 text-contrast-muted` + (gutterBottom ? ` mb-0.5` : ``)}
		>
			<div class="flex items-center overflow-hidden text-sm">
				<a
					href={authorHref}
					onClick={() => precacheProfile(queryClient, author)}
					class="overflow-hidden text-ellipsis whitespace-nowrap"
				>
					<span class="font-semibold text-contrast hover:underline">
						{/* @once */ author.handle.toLowerCase()}
					</span>
				</a>

				<span class="pl-2"> </span>

				<TimeAgo value={indexedAt}>
					{(relative, absolute) => (
						<a title={absolute()} href={href} class="whitespace-nowrap hover:underline">
							{relative()}
						</a>
					)}
				</TimeAgo>
			</div>

			<div class="flex shrink-0 items-center gap-4">
				{props.context?.rootAuthorLike && (
					<div class="relative">
						<Avatar type="user" size={null} class="h-[18px] w-[18px]" />
						<HeartSolidIcon class="absolute -bottom-1 -left-1.5 h-[14px] w-[14px] stroke-background stroke-[3] text-p-red-600" />
					</div>
				)}

				<button
					onClick={(ev) => {
						const anchor = ev.currentTarget;
						openModal(() => (
							<PostOverflowMenu
								anchor={anchor}
								post={post}
								onPostDelete={onPostDelete}
								onPostRedraft={onPostRedraft}
							/>
						));
					}}
					class="-mx-2 -my-1.5 flex h-8 w-8 items-center justify-center rounded-full text-base hover:bg-accent/md hover:text-accent active:bg-accent/md-pressed"
				>
					<MoreHorizOutlinedIcon />
				</button>
			</div>
		</div>
	);
};

export default PostMeta;
