import { createMemo } from 'solid-js';

import type { AppBskyFeedPost } from '@atcute/client/lexicons';

import { usePostShadow } from '~/api/cache/post-shadow';
import { ContextContentList, getModerationUI } from '~/api/moderation';
import { moderatePost } from '~/api/moderation/entities/post';
import { parseAtUri } from '~/api/utils/strings';

import { history } from '~/globals/navigation';

import type { HydratedBookmarkItem } from '~/lib/aglais-bookmarks/db';
import { isElementAltClicked, isElementClicked } from '~/lib/interaction';
import { useModerationOptions } from '~/lib/states/moderation';

import Avatar, { getUserAvatarType } from '../avatar';
import Embed from '../embeds/embed';
import ContentHider from '../moderation/content-hider';
import ModerationAlerts from '../moderation/moderation-alerts';
import RichText from '../rich-text';
import PostActions from '../timeline/post-actions';
import PostMeta from '../timeline/post-meta';
import PostReplyContext from '../timeline/post-reply-context';

export interface BookmarkFeedItemProps {
	/** Expected to be static */
	item: HydratedBookmarkItem;
}

const BookmarkFeedItem = ({ item }: BookmarkFeedItemProps) => {
	const moderationOptions = useModerationOptions();

	const { post, stale } = item;

	const author = post.author;
	const record = post.record as AppBskyFeedPost.Record;
	const embed = post.embed;

	const shadow = usePostShadow(post);

	const uri = parseAtUri(post.uri);
	const authorHref = `/${author.did}`;
	const href = `/${author.did}/${uri.rkey}`;

	const moderation = createMemo(() => moderatePost(post, moderationOptions()));
	const ui = createMemo(() => getModerationUI(moderation(), ContextContentList));

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
			class="relative flex gap-3 border-b border-outline px-4 pt-3"
			style={{ '--embed-left-gutter': '64px' }}
		>
			<div class="flex shrink-0 flex-col items-center">
				<Avatar
					type={/* @once */ getUserAvatarType(author)}
					src={/* @once */ author.avatar}
					moderation={moderation()}
				/>
			</div>

			<div class="min-w-0 grow pb-3">
				<PostMeta post={post} href={href} authorHref={authorHref} gutterBottom />
				<PostReplyContext item={{ post, reply: undefined, reason: undefined, next: false, prev: false }} />

				<ModerationAlerts ui={ui()} class="-mx-1 my-1" />

				<ContentHider ui={ui()} containerClass="mt-2" innerClass="mt-2">
					<RichText text={/* @once */ record.text} facets={/* @once */ record.facets} clipped />
					{embed && <Embed embed={embed} moderation={moderation()} gutterTop />}
				</ContentHider>

				<PostActions post={post} shadow={shadow()} disabled={stale} />
			</div>
		</div>
	);
};

export default BookmarkFeedItem;
