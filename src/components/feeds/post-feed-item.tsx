import { createMemo } from 'solid-js';

import type { AppBskyFeedPost, At } from '@mary/bluesky-client/lexicons';

import { usePostShadow } from '~/api/cache/post-shadow';
import { useProfileShadow } from '~/api/cache/profile-shadow';
import type { UiTimelineItem } from '~/api/models/timeline';
import { ContextContentList, getModerationUI } from '~/api/moderation';
import { moderatePost } from '~/api/moderation/entities/post';
import { parseAtUri } from '~/api/utils/strings';

import { history } from '~/globals/navigation';

import { isElementAltClicked, isElementClicked } from '~/lib/interaction';
import { useModerationOptions } from '~/lib/states/moderation';

import Avatar from '../avatar';
import RepeatOutlinedIcon from '../icons-central/repeat-outline';
import RichText from '../rich-text';

import Embed from '../embeds/embed';
import ContentHider from '../moderation/content-hider';
import PostActions from './post-actions';
import PostMeta from './post-meta';
import PostReplyContext from './post-reply-context';

export interface PostFeedItemProps {
	/** Expected to be static */
	item: UiTimelineItem;
	timelineDid?: At.DID;
}

const PostFeedItem = ({ item, timelineDid }: PostFeedItemProps) => {
	const moderationOptions = useModerationOptions();

	const { post, reason, next, prev } = item;

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
			tabindex={0}
			hidden={shadow().deleted}
			class={`relative border-outline px-4 hover:bg-contrast/sm` + (!next ? ` border-b` : ``)}
			onClick={(ev) => {
				if (!isElementClicked(ev)) {
					return;
				}

				ev.preventDefault();

				if (isElementAltClicked(ev)) {
					window.open(href, '_blank');
				} else {
					history.navigate(href);
				}
			}}
		>
			<div class="relative flex flex-col pb-1 pt-2">
				{prev && (
					<div class="flex w-9 flex-col items-center">
						<div class="absolute bottom-1 top-0 grow border-l-2 border-outline-md" />
					</div>
				)}

				{/* @once */ renderReason(reason)}
			</div>

			<div class="flex gap-3">
				<div class="flex shrink-0 flex-col items-center">
					<Avatar
						type={/* @once */ author.associated?.labeler ? 'labeler' : 'user'}
						src={/* @once */ author.avatar}
						href={authorHref}
						moderation={moderation()}
					/>

					{next && <div class="mt-1 grow border-l-2 border-outline-md" />}
				</div>

				<div class="min-w-0 grow pb-3">
					<PostMeta post={post} href={href} authorHref={authorHref} gutterBottom />
					<PostReplyContext item={item} />

					<ContentHider
						ui={getModerationUI(moderation(), ContextContentList)}
						ignoreMute={/* @once */ timelineDid === author.did}
						containerClass="mt-2"
						innerClass="mt-2"
					>
						<RichText text={/* @once */ record.text} facets={/* @once */ record.facets} clipped />
						{embed && <Embed embed={embed} moderation={moderation()} gutterTop />}
					</ContentHider>

					<PostActions post={post} shadow={shadow()} />
				</div>
			</div>
		</div>
	);
};

export default PostFeedItem;

const renderReason = (reason: UiTimelineItem['reason']) => {
	if (reason) {
		const type = reason.$type;

		if (type === 'app.bsky.feed.defs#reasonRepost') {
			const by = reason.by;
			const did = by.did;
			const name = by.displayName || by.handle;

			return (
				<div class="flex items-center gap-3 text-de text-contrast-muted">
					<div class="flex w-9 shrink-0 justify-end">
						<RepeatOutlinedIcon class="text-sm" />
					</div>
					<a href={`/${did}`} class="flex min-w-0 font-medium hover:underline">
						<span dir="auto" class="overflow-hidden text-ellipsis whitespace-nowrap">
							{name}
						</span>
						<span class="shrink-0 whitespace-pre"> Reposted</span>
					</a>
				</div>
			);
		}
	}
};
