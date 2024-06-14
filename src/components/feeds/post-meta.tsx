import type { AppBskyFeedDefs } from '@mary/bluesky-client/lexicons';

import { handleLinkNavigation } from '../button';
import MoreHorizOutlinedIcon from '../icons-central/more-horiz-outline';
import TimeAgo from '../time-ago';

export interface PostMetaProps {
	/** Expected to be static */
	post: AppBskyFeedDefs.PostView;
	authorHref: string;
	href: string;
	gutterBottom?: boolean;
}

const PostMeta = ({ post, authorHref, href, gutterBottom }: PostMetaProps) => {
	const author = post.author;

	const displayName = author.displayName;
	const handle = author.handle;
	const indexedAt = post.indexedAt;

	return (
		<div
			class={`flex items-center justify-between gap-4 text-c-contrast-600` + (gutterBottom ? ` mb-0.5` : ``)}
		>
			<div class="flex items-center overflow-hidden text-sm">
				<a
					href={authorHref}
					onClick={handleLinkNavigation}
					class="flex max-w-full gap-1 overflow-hidden text-ellipsis whitespace-nowrap text-left"
				>
					{displayName && (
						<bdi class="overflow-hidden text-ellipsis font-bold text-c-contrast-900 hover:underline">
							{displayName}
						</bdi>
					)}

					<span class="block overflow-hidden text-ellipsis whitespace-nowrap">@{handle}</span>
				</a>

				<span class="px-1">·</span>

				<TimeAgo value={indexedAt}>
					{(relative, absolute) => (
						<a
							title={absolute()}
							href={href}
							onClick={handleLinkNavigation}
							class="whitespace-nowrap hover:underline"
						>
							{relative()}
						</a>
					)}
				</TimeAgo>
			</div>

			<div class="shrink-0">
				<button class="-mx-2 -my-1.5 flex h-8 w-8 items-center justify-center rounded-full text-base hover:bg-c-contrast-50">
					<MoreHorizOutlinedIcon />
				</button>
			</div>
		</div>
	);
};

export default PostMeta;
