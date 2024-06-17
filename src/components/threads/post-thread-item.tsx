import type { AppBskyFeedPost } from '@mary/bluesky-client/lexicons';

import { usePostShadow } from '~/api/cache/post-shadow';
import type { PostAncestorItem, PostDescendantItem } from '~/api/models/post-thread';
import { parseAtUri } from '~/api/utils/strings';

import Avatar from '../avatar';
import RichText from '../rich-text';

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
	const { post, lines, depth = 0, end = false } = item;

	const shadow = usePostShadow(post);

	const author = post.author;
	const record = post.record as AppBskyFeedPost.Record;

	const uri = parseAtUri(post.uri);
	const authorHref = `/${author.did}`;
	const href = `/${author.did}/${uri.rkey}`;

	return (
		<div
			class={
				`flex border-c-contrast-200 px-3 hover:bg-c-contrast-25 ` + (!treeView && end ? ` border-b` : ``)
			}
		>
			<ThreadLines lines={lines} />

			<div class={`flex min-w-0 grow` + (!treeView ? ` gap-3` : ` gap-2`)}>
				<div class={`relative flex shrink-0 flex-col items-center` + (!treeView ? ` pt-3` : ` pt-2`)}>
					{!treeView && depth !== 0 && (
						<div class="absolute top-0 h-2 border-l-2 border-c-contrast-100"></div>
					)}

					<Avatar type="user" src={/* @once */ author.avatar} size={!treeView ? 'md' : 'xs'} />

					{!end && (
						<div class={`grow border-l-2 border-c-contrast-100` + (!treeView ? ` mt-1` : ` mt-0.5`)}></div>
					)}
				</div>

				<div class={`min-w-0 grow` + (!treeView ? ` py-3` : ` py-2`)}>
					<PostMeta post={post} href={href} authorHref={authorHref} compact={treeView} gutterBottom />

					<RichText text={/* @once */ record.text} facets={/* @once */ record.facets} clipped />

					<PostActions post={post} shadow={shadow()} compact />
				</div>
			</div>
		</div>
	);
};

export default PostThreadItem;
