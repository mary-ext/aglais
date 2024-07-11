import { createMemo } from 'solid-js';

import type { AppBskyFeedPost } from '@mary/bluesky-client/lexicons';

import { usePostShadow } from '~/api/cache/post-shadow';
import { useProfileShadow } from '~/api/cache/profile-shadow';
import type { PostAncestorItem, PostDescendantItem } from '~/api/models/post-thread';
import { ContextContentList, getModerationUI } from '~/api/moderation';
import { moderatePost } from '~/api/moderation/entities/post';
import { parseAtUri } from '~/api/utils/strings';

import { history } from '~/globals/navigation';

import { isElementAltClicked, isElementClicked } from '~/lib/interaction';
import { useModerationOptions } from '~/lib/states/moderation';

import Avatar from '../avatar';
import RichText from '../rich-text';

import Embed from '../embeds/embed';
import PostActions from '../feeds/post-actions';
import PostMeta from '../feeds/post-meta';
import ContentHider from '../moderation/content-hider';

import ThreadLines from './thread-lines';

export interface PostThreadItemProps {
	/** Not static, but expects the URI (post identifier) to be static */
	item: PostAncestorItem | PostDescendantItem;
	/** Expected to be static */
	treeView: boolean;
}

const PostThreadItem = (props: PostThreadItemProps) => {
	const treeView = props.treeView;
	const item = () => props.item;

	const moderationOptions = useModerationOptions();

	const post = () => item().post;
	const prev = item().prev;
	const next = item().next;

	const author = () => post().author;
	const record = post().record as AppBskyFeedPost.Record;
	const embed = post().embed;

	const shadow = usePostShadow(post);
	const authorShadow = useProfileShadow(author);

	const uri = parseAtUri(post().uri);
	const authorHref = `/${author().did}`;
	const href = `/${author().did}/${uri.rkey}`;

	const moderation = createMemo(() => moderatePost(post(), authorShadow(), moderationOptions()));

	const handleClick = (ev: MouseEvent | KeyboardEvent) => {
		if (!isElementClicked(ev)) {
			return;
		}

		ev.preventDefault();

		if (isElementAltClicked(ev)) {
			window.open(href, '_blank');
		} else {
			history.navigate(href);
		}
	};

	return (
		<div
			tabindex={0}
			hidden={shadow().deleted}
			onClick={handleClick}
			onAuxClick={handleClick}
			onKeyDown={handleClick}
			class={
				`flex border-outline hover:bg-contrast/sm` +
				// prettier-ignore
				(!treeView ? ` px-4` + (!next ? ` border-b` : ``) : ` px-3`)
			}
		>
			<ThreadLines lines={item().lines} />

			<div class={`flex min-w-0 grow` + (!treeView ? ` gap-3` : ` gap-2`)}>
				<div class="relative flex shrink-0 flex-col items-center pt-3">
					{!treeView && prev && <div class="absolute top-0 h-2 border-l-2 border-outline-md"></div>}

					<Avatar type="user" src={author().avatar} size={!treeView ? 'md' : 'xs'} />

					{next && (
						<div class={`grow border-l-2 border-outline-md` + (!treeView ? ` mt-1` : ` mt-0.5`)}></div>
					)}
				</div>

				<div class="min-w-0 grow py-3">
					<PostMeta post={post()} href={href} authorHref={authorHref} compact={treeView} gutterBottom />

					<ContentHider
						ui={getModerationUI(moderation(), ContextContentList)}
						containerClass="mt-2"
						innerClass="mt-2"
					>
						<RichText text={/* @once */ record.text} facets={/* @once */ record.facets} clipped />
						{embed && <Embed embed={embed} moderation={moderation()} gutterTop />}
					</ContentHider>

					<PostActions post={post()} shadow={shadow()} compact={treeView} />
				</div>
			</div>
		</div>
	);
};

export default PostThreadItem;
