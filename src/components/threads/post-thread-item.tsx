import { type JSX, Show, createMemo } from 'solid-js';

import type { AppBskyFeedPost } from '@atcute/bluesky';
import { useQueryClient } from '@mary/solid-query';

import { usePostShadow } from '~/api/cache/post-shadow';
import type { PostAncestorItem, PostDescendantItem } from '~/api/models/post-thread';
import { getModerationUI } from '~/api/moderation';
import { ContextContentList } from '~/api/moderation/constants';
import { moderatePost } from '~/api/moderation/entities/post';
import { precacheProfile } from '~/api/queries-cache/profile-precache';
import { assertCanonicalResourceUri } from '~/api/types/at-uri';

import { history } from '~/globals/navigation';

import { isElementAltClicked, isElementClicked } from '~/lib/interaction';
import { useSession } from '~/lib/states/session';
import { inject } from '~/lib/states/singleton';
import ModerationService from '~/lib/states/singletons/moderation';

import Avatar, { getUserAvatarType } from '../avatar';
import Embed from '../embeds/embed';
import ContentHider from '../moderation/content-hider';
import RichText from '../rich-text';
import PostActions from '../timeline/post-actions';
import PostMeta from '../timeline/post-meta';

import ThreadLines from './thread-lines';

export interface PostThreadItemProps {
	/** Not static, but expects the URI (post identifier) to be static */
	item: PostAncestorItem | PostDescendantItem;
	/** Expected to be static */
	treeView: boolean;
	onPostDelete?: () => void;
	onPostRedraft?: () => void;
	onReplyPublish?: () => void;
}

const PostThreadItem = (props: PostThreadItemProps) => {
	const treeView = props.treeView;
	const item = () => props.item;

	const queryClient = useQueryClient();
	const { currentAccount } = useSession();

	const moderationOptions = inject(ModerationService);

	const post = () => item().post;

	const author = () => post().author;
	const record = post().record as AppBskyFeedPost.Main;
	const embed = post().embed;

	const shadow = usePostShadow(post);

	const authorHref = `/${author().did}`;
	const href = `/${author().did}/${assertCanonicalResourceUri(post().uri).rkey}`;

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
			style={{ '--embed-left-gutter': !treeView ? '64px' : `${12 + 8 + (item().lines!.length + 1) * 20}px` }}
		>
			<ThreadLines lines={item().lines} />

			<div class={`flex min-w-0 grow` + (!treeView ? ` gap-3` : ` gap-2`)}>
				<div class="relative flex shrink-0 flex-col items-center pt-3">
					{!treeView && item().prev && <div class="absolute top-0 h-2 border-l-2 border-outline-md"></div>}

					<Avatar
						type={/* @once */ getUserAvatarType(author())}
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
							gutterBottom
							onPostRedraft={/* @once */ props.onPostRedraft}
							onPostDelete={/* @once */ props.onPostDelete}
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
