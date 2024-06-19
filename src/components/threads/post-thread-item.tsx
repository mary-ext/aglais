import { createMemo } from 'solid-js';

import type { AppBskyFeedPost } from '@mary/bluesky-client/lexicons';

import { usePostShadow } from '~/api/cache/post-shadow';
import { useProfileShadow } from '~/api/cache/profile-shadow';
import type { PostAncestorItem, PostDescendantItem } from '~/api/models/post-thread';
import { moderatePost } from '~/api/moderation/entities/post';
import { parseAtUri } from '~/api/utils/strings';

import { useModerationOptions } from '~/lib/states/moderation';

import Avatar from '../avatar';
import RichText from '../rich-text';

import Embed from '../embeds/embed';
import PostActions from '../feeds/post-actions';
import PostMeta from '../feeds/post-meta';
import ThreadLines from './thread-lines';

export interface PostThreadItemProps {
	/** Expected to be static */
	item: PostAncestorItem | PostDescendantItem;
	/** Expected to be static */
	treeView: boolean;
}

const PostThreadItem = ({ item, treeView }: PostThreadItemProps) => {
	const moderationOptions = useModerationOptions();

	const { post, lines, prev, next } = item;

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
		<div
			class={
				`flex border-c-contrast-200 hover:bg-c-contrast-25` +
				// prettier-ignore
				(!treeView ? ` px-4` + (!next ? ` border-b` : ``) : ` px-3`)
			}
		>
			<ThreadLines lines={lines} />

			<div class={`flex min-w-0 grow` + (!treeView ? ` gap-3` : ` gap-2`)}>
				<div class="relative flex shrink-0 flex-col items-center pt-3">
					{!treeView && prev && <div class="absolute top-0 h-2 border-l-2 border-c-contrast-100"></div>}

					<Avatar type="user" src={/* @once */ author.avatar} size={!treeView ? 'md' : 'xs'} />

					{next && (
						<div class={`grow border-l-2 border-c-contrast-100` + (!treeView ? ` mt-1` : ` mt-0.5`)}></div>
					)}
				</div>

				<div class="min-w-0 grow py-3">
					<PostMeta post={post} href={href} authorHref={authorHref} compact={treeView} gutterBottom />

					<RichText text={/* @once */ record.text} facets={/* @once */ record.facets} clipped />
					{embed && <Embed embed={embed} moderation={moderation()} gutterTop />}

					<PostActions post={post} shadow={shadow()} compact />
				</div>
			</div>
		</div>
	);
};

export default PostThreadItem;
