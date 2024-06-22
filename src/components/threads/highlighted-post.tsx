import { createMemo } from 'solid-js';

import type { AppBskyFeedDefs, AppBskyFeedPost } from '@mary/bluesky-client/lexicons';

import { usePostShadow } from '~/api/cache/post-shadow';
import { useProfileShadow } from '~/api/cache/profile-shadow';
import { moderatePost } from '~/api/moderation/entities/post';
import { EQUALS_DEQUAL } from '~/api/utils/dequal';
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
	post: AppBskyFeedDefs.PostView;
	/** Expected to be static */
	prev?: boolean;
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

	return (
		<div class="px-4 pt-3">
			<div class="relative mb-3 flex items-center justify-between gap-3 text-sm text-contrast-muted">
				{props.prev && (
					<div class="absolute bottom-full mb-1 flex h-3 w-9 flex-col items-center">
						<div class="grow border-l-2 border-outline-md" />
					</div>
				)}

				<a class="inline-flex min-w-0 max-w-full items-center gap-3">
					<Avatar
						type={author().associated?.labeler ? 'labeler' : 'user'}
						src={author().avatar}
						moderation={moderation()}
					/>

					<div class="max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
						<bdi class="overflow-hidden text-ellipsis">
							<span class="font-bold text-contrast">{author().displayName}</span>
						</bdi>
						<p class="overflow-hidden text-ellipsis whitespace-nowrap">{'@' + author().handle}</p>
					</div>
				</a>

				<div class="flex shrink-0 items-center gap-4">
					<button class="-mx-2 -my-1.5 flex h-8 w-8 items-center justify-center rounded-full text-base hover:bg-accent/md hover:text-accent active:bg-accent/md-pressed">
						<MoreHorizOutlinedIcon />
					</button>
				</div>
			</div>

			<div class="mt-3">
				<RichText text={record().text} facets={record().facets} large />
				{embed() && <Embed embed={embed()!} moderation={moderation()} gutterTop large />}
			</div>

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
		</div>
	);
};

export default HighlightedPost;
