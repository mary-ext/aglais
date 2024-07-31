import { createMemo, type JSX, Show } from 'solid-js';

import type { AppBskyFeedPost } from '@mary/bluesky-client/lexicons';
import { useQueryClient } from '@mary/solid-query';

import { usePostShadow } from '~/api/cache/post-shadow';
import type { PostAncestorItem, PostDescendantItem } from '~/api/models/post-thread';
import { ContextContentList, getModerationUI } from '~/api/moderation';
import { moderatePost } from '~/api/moderation/entities/post';
import { precacheProfile } from '~/api/queries-cache/profile-precache';
import { parseAtUri } from '~/api/utils/strings';

import { history } from '~/globals/navigation';

import { isElementAltClicked, isElementClicked } from '~/lib/interaction';
import { useModerationOptions } from '~/lib/states/moderation';
import { useSession } from '~/lib/states/session';

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
	onReplyPublish?: () => void;
}

const PostThreadItem = (props: PostThreadItemProps) => {
	const treeView = props.treeView;
	const item = () => props.item;

	const queryClient = useQueryClient();
	const moderationOptions = useModerationOptions();
	const { currentAccount } = useSession();

	const post = () => item().post;

	const author = () => post().author;
	const record = post().record as AppBskyFeedPost.Record;
	const embed = post().embed;

	const shadow = usePostShadow(post);

	const uri = parseAtUri(post().uri);
	const authorHref = `/${author().did}`;
	const href = `/${author().did}/${uri.rkey}`;

	const isOurPost = currentAccount && currentAccount.did === author().did;

	const moderation = createMemo(() => moderatePost(post(), moderationOptions()));

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
				`flex border-outline hover:bg-contrast/sm` +
				// prettier-ignore
				(!treeView ? ` px-4` + (!item().next ? ` border-b` : ``) : ` px-3`)
			}
		>
			<ThreadLines lines={item().lines} />

			<div class={`flex min-w-0 grow` + (!treeView ? ` gap-3` : ` gap-2`)}>
				<div class="relative flex shrink-0 flex-col items-center pt-3">
					{!treeView && item().prev && <div class="absolute top-0 h-2 border-l-2 border-outline-md"></div>}

					<Avatar
						type={/* @once */ author().associated?.labeler ? 'labeler' : 'user'}
						src={/* @once */ author().avatar}
						moderation={moderation()}
						href={authorHref}
						onClick={() => precacheProfile(queryClient, author())}
						size={!treeView ? 'md' : 'xs'}
					/>

					{item().next && (
						<div class={`grow border-l-2 border-outline-md` + (!treeView ? ` mt-1` : ` mt-0.5`)}></div>
					)}
				</div>

				<DeletedGate bypass={!isOurPost} deleted={shadow().deleted} treeView={treeView}>
					<div class="min-w-0 grow py-3">
						<PostMeta
							post={/* @once */ post()}
							href={href}
							authorHref={authorHref}
							compact={treeView}
							gutterBottom
						/>

						<ContentHider
							ui={getModerationUI(moderation(), ContextContentList)}
							containerClass="mt-2"
							innerClass="mt-2"
						>
							<RichText text={/* @once */ record.text} facets={/* @once */ record.facets} clipped />
							{embed && <Embed embed={embed} moderation={moderation()} gutterTop />}
						</ContentHider>

						<PostActions
							post={post()}
							shadow={shadow()}
							compact={treeView}
							onReplyPublish={/* @once */ props.onReplyPublish}
						/>
					</div>
				</DeletedGate>
			</div>
		</div>
	);
};

export default PostThreadItem;

export interface DeletedGateProps {
	deleted: boolean;
	bypass: boolean;
	treeView: boolean;
	children: JSX.Element;
}

const DeletedGate = (props: DeletedGateProps) => {
	if (props.bypass) {
		return props.children;
	}

	const treeView = props.treeView;
	return (
		<Show when={props.deleted} fallback={props.children}>
			<div class="min-w-0 grow py-3">
				<div class={'flex items-center' + (!treeView ? ` h-9 text-sm` : ` text-de`)}>
					<p class="text-contrast-muted">Post deleted</p>
				</div>
			</div>
		</Show>
	);
};
