import { createMemo } from 'solid-js';

import type { AppBskyFeedDefs, AppBskyFeedPost } from '@mary/bluesky-client/lexicons';

import { usePostShadow } from '~/api/cache/post-shadow';
import { useProfileShadow } from '~/api/cache/profile-shadow';
import { moderatePost } from '~/api/moderation/entities/post';
import { parseAtUri } from '~/api/utils/strings';

import { formatCompact } from '~/lib/intl/number';
import { formatAbsDateTime } from '~/lib/intl/time';
import { useModerationOptions } from '~/lib/states/moderation';

import Avatar from '../avatar';
import Divider from '../divider';
import MoreHorizOutlinedIcon from '../icons-central/more-horiz-outline';
import RichText from '../rich-text';

import Embed from '../embeds/embed';

export interface HighlightedPostProps {
	/** Expected to be static */
	post: AppBskyFeedDefs.PostView;
	prev?: boolean;
}

const HighlightedPost = ({ post, prev }: HighlightedPostProps) => {
	const moderationOptions = useModerationOptions();

	const author = post.author;
	const record = post.record as AppBskyFeedPost.Record;
	const embed = post.embed;

	const shadow = usePostShadow(post);
	const authorShadow = useProfileShadow(author);

	const uri = parseAtUri(post.uri);
	const authorHref = `/${author.did}`;
	const href = `/${author.did}/${uri.rkey}`;

	const moderation = createMemo(() => moderatePost(post, authorShadow(), moderationOptions()));

	return (
		<div class="px-4 pt-3">
			<div class="relative mb-3 flex items-center justify-between gap-3 text-sm text-c-contrast-600">
				{prev && (
					<div class="absolute bottom-full mb-1 flex h-3 w-9 flex-col items-center">
						<div class="grow border-l-2 border-c-contrast-100" />
					</div>
				)}

				<a class="inline-flex min-w-0 max-w-full items-center gap-3">
					<Avatar
						type={/* @once */ author.associated?.labeler ? 'labeler' : 'user'}
						src={/* @once */ author.avatar}
						moderation={moderation()}
					/>

					<div class="max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
						<bdi class="overflow-hidden text-ellipsis">
							<span class="font-bold text-c-contrast-900">{/* @once */ author.displayName}</span>
						</bdi>
						<p class="overflow-hidden text-ellipsis whitespace-nowrap">{/* @once */ '@' + author.handle}</p>
					</div>
				</a>

				<div class="flex shrink-0 items-center gap-4">
					<button class="-mx-2 -my-1.5 flex h-8 w-8 items-center justify-center rounded-full text-base hover:bg-c-contrast-50">
						<MoreHorizOutlinedIcon />
					</button>
				</div>
			</div>

			<div class="mt-3">
				<RichText text={/* @once */ record.text} facets={/* @once */ record.facets} large />
				{embed && <Embed embed={embed} moderation={moderation()} gutterTop large />}
			</div>

			<p class="mt-3 text-sm text-c-contrast-600">{/* @once */ formatAbsDateTime(post.indexedAt)}</p>

			<Divider gutterTop="md" />

			<div class="flex flex-wrap gap-4 py-4 text-sm">
				<a class="hover:underline">
					<span class="font-bold">{formatCompact(shadow().repostCount)}</span>
					<span class="text-c-contrast-600"> Reposts</span>
				</a>

				<a class="hover:underline">
					<span class="font-bold">{formatCompact(shadow().likeCount)}</span>
					<span class="text-c-contrast-600"> Likes</span>
				</a>
			</div>
		</div>
	);
};

export default HighlightedPost;
