import { createMemo } from 'solid-js';

import type { AppBskyFeedPost, At } from '@atcute/client/lexicons';
import { useQueryClient } from '@mary/solid-query';

import { usePostShadow } from '~/api/cache/post-shadow';
import type { UiTimelineItem } from '~/api/models/timeline';
import { ContextContentList, getModerationUI } from '~/api/moderation';
import { moderatePost } from '~/api/moderation/entities/post';
import { precacheProfile } from '~/api/queries-cache/profile-precache';
import { parseAtUri } from '~/api/utils/strings';

import { history } from '~/globals/navigation';

import { isElementAltClicked, isElementClicked } from '~/lib/interaction';
import { useModerationOptions } from '~/lib/states/moderation';
import { useSession } from '~/lib/states/session';

import Avatar, { getUserAvatarType } from '../avatar';
import Embed from '../embeds/embed';
import PinOutlinedIcon from '../icons-central/pin-outline';
import RepeatOutlinedIcon from '../icons-central/repeat-outline';
import ContentHider from '../moderation/content-hider';
import ModerationAlerts from '../moderation/moderation-alerts';
import RichText from '../rich-text';

import PostActions from './post-actions';
import PostDeletedGate from './post-deleted-gate';
import PostMeta from './post-meta';
import PostReplyContext from './post-reply-context';

export interface PostFeedItemProps {
	/** Expected to be static */
	item: UiTimelineItem;
	highlighted?: boolean;
	timelineDid?: At.DID;
}

const PostFeedItem = ({ item, highlighted, timelineDid }: PostFeedItemProps) => {
	const queryClient = useQueryClient();
	const moderationOptions = useModerationOptions();
	const { currentAccount } = useSession();

	const { post, reason, next, prev } = item;

	const author = post.author;
	const record = post.record as AppBskyFeedPost.Record;
	const embed = post.embed;

	const shadow = usePostShadow(post);

	const uri = parseAtUri(post.uri);
	const authorHref = `/${author.did}`;
	const href = `/${author.did}/${uri.rkey}`;

	const isOurPost = currentAccount && author.did === currentAccount.did;

	const moderation = createMemo(() => moderatePost(post, moderationOptions()));
	const ui = createMemo(() => getModerationUI(moderation(), ContextContentList));

	const handleClick = (ev: MouseEvent | KeyboardEvent) => {
		if (!isElementClicked(ev) || shadow().deleted) {
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
			onClick={handleClick}
			onAuxClick={handleClick}
			onKeyDown={handleClick}
			class={
				`relative border-outline px-4` +
				(!highlighted ? ` hover:bg-contrast/sm` : ` bg-accent/15 hover:bg-accent/md`) +
				(!next ? ` border-b` : ``)
			}
			style={{ '--embed-left-gutter': '64px' }}
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
						type={/* @once */ getUserAvatarType(author)}
						src={/* @once */ author.avatar}
						href={authorHref}
						moderation={moderation()}
						onClick={() => precacheProfile(queryClient, author)}
					/>

					{next && <div class="mt-1 grow border-l-2 border-outline-md" />}
				</div>

				<PostDeletedGate bypass={!isOurPost} deleted={shadow().deleted}>
					<div class="min-w-0 grow pb-3">
						<PostMeta post={post} href={href} authorHref={authorHref} gutterBottom />
						<PostReplyContext item={item} />

						<ModerationAlerts ui={ui()} class="-mx-1 my-1" />

						<ContentHider
							ui={ui()}
							ignoreMute={/* @once */ timelineDid === author.did}
							containerClass="mt-2"
							innerClass="mt-2"
						>
							<RichText text={/* @once */ record.text} facets={/* @once */ record.facets} clipped />
							{embed && <Embed embed={embed} moderation={moderation()} gutterTop />}
						</ContentHider>

						<PostActions post={post} shadow={shadow()} />
					</div>
				</PostDeletedGate>
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

			return (
				<div class="flex items-center gap-3 text-de text-contrast-muted">
					<div class="flex w-9 shrink-0 justify-end">
						<RepeatOutlinedIcon class="text-sm" />
					</div>
					<a href={`/${did}`} class="flex min-w-0 hover:underline">
						<span dir="auto" class="overflow-hidden text-ellipsis whitespace-nowrap font-bold">
							{/* @once */ by.handle}
						</span>
						<span class="shrink-0 whitespace-pre"> reposted</span>
					</a>
				</div>
			);
		}

		if (type === 'app.bsky.feed.defs#reasonPin') {
			return (
				<div class="flex items-center gap-3 text-de text-contrast-muted">
					<div class="flex w-9 shrink-0 justify-end">
						<PinOutlinedIcon class="text-sm" />
					</div>
					<span class="flex min-w-0">Pinned</span>
				</div>
			);
		}
	}
};
