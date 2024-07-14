import { For, Match, Switch, createEffect, createMemo } from 'solid-js';

import type { AppBskyFeedDefs, AppBskyFeedPost, At, Brand } from '@mary/bluesky-client/lexicons';
import { XRPCError } from '@mary/bluesky-client/xrpc';
import { useQueryClient } from '@mary/solid-query';

import {
	createThreadData,
	type OverflowDescendantItem,
	type PostDescendantItem,
} from '~/api/models/post-thread';
import { usePostThreadQuery } from '~/api/queries/post-thread';
import { dequal } from '~/api/utils/dequal';
import { isDid } from '~/api/utils/strings';

import { history } from '~/globals/navigation';

import { createEventListener } from '~/lib/hooks/event-listener';
import { Key } from '~/lib/keyed';
import { useParams } from '~/lib/navigation/router';
import { useModerationOptions } from '~/lib/states/moderation';
import { useSession } from '~/lib/states/session';

import CircularProgress from '~/components/circular-progress';
import CircularProgressView from '~/components/circular-progress-view';
import Divider from '~/components/divider';
import ErrorView from '~/components/error-view';
import Keyed from '~/components/keyed';
import * as Page from '~/components/page';
import VirtualItem from '~/components/virtual-item';

import HighlightedPost from '~/components/threads/highlighted-post';
import OverflowThreadItem from '~/components/threads/overflow-thread-item';
import PostThreadItem from '~/components/threads/post-thread-item';
import ThreadLines from '~/components/threads/thread-lines';

const PostThreadPage = () => {
	const { didOrHandle, rkey } = useParams();

	const queryClient = useQueryClient();
	const query = usePostThreadQuery(() => `at://${didOrHandle}/app.bsky.feed.post/${rkey}`);

	return (
		<>
			<Page.Header>
				<Page.HeaderAccessory>
					<Page.Back to="/" />
				</Page.HeaderAccessory>

				<Page.Heading title="Post" />
			</Page.Header>

			<Switch>
				<Match when={query.error} keyed>
					{(error) => {
						if (error instanceof XRPCError) {
							if (error.kind === 'NotFound') {
								return (
									<div class="px-4 py-3">
										<div class="rounded-md border border-outline p-3">
											<p class="text-sm text-contrast-muted">This post is unavailable</p>
										</div>
									</div>
								);
							}
						}

						return <ErrorView error={error} onRetry={() => query.refetch()} />;
					}}
				</Match>

				<Match when={query.data}>
					{(accessor) => (
						<Switch>
							<Match
								when={(() => {
									// Redirect to DID URIs when possible
									if (!isDid(didOrHandle)) {
										const data = accessor();
										const type = data.$type;

										let did: At.DID | undefined;

										if (type === 'app.bsky.feed.defs#threadViewPost') {
											did = data.post.author.did;
										} else if (type === 'app.bsky.feed.defs#blockedPost') {
											did = data.author.did;
										}

										if (did !== undefined) {
											return { data, did };
										}
									}
								})()}
								keyed
							>
								{({ data, did }) => {
									queryClient.setQueryData(['post-thread', `at://${did}/app.bsky.feed.post/${rkey}`], data);
									history.navigate(`/${did}/${rkey}`, { replace: true });
									return null;
								}}
							</Match>

							<Match
								when={(() => {
									const data = accessor();
									if (data.$type === 'app.bsky.feed.defs#blockedPost' && data.author.viewer?.blocking) {
										return data.author;
									}
								})()}
								keyed
							>
								{null}
							</Match>

							<Match
								when={(() => {
									const data = accessor();
									if (data.$type === 'app.bsky.feed.defs#threadViewPost') {
										return data;
									}
								})()}
							>
								{(result) => (
									<ThreadView
										data={result()}
										isPlaceholderData={query.isPlaceholderData}
										onReplyPublish={() => query.refetch()}
									/>
								)}
							</Match>

							<Match when>{null}</Match>
						</Switch>
					)}
				</Match>

				<Match when>
					<CircularProgressView />
				</Match>
			</Switch>
		</>
	);
};

export default PostThreadPage;

const ThreadView = (props: {
	data: Brand.Union<AppBskyFeedDefs.ThreadViewPost>;
	isPlaceholderData: boolean;
	onReplyPublish?: () => void;
}) => {
	const { currentAccount } = useSession();
	const moderationOptions = useModerationOptions();

	const thread = createMemo(() => {
		return createThreadData({
			thread: props.data,
			moderationOptions: moderationOptions(),
			preferences: currentAccount?.preferences.threadView ?? {
				followsFirst: false,
				sort: 'clout',
				treeView: false,
			},
		});
	});

	const isLoadingAncestor = () => {
		if (!props.isPlaceholderData) {
			return false;
		}

		const { ancestors, post: root } = thread();

		let post: AppBskyFeedDefs.PostView = root;
		if (ancestors.length !== 0) {
			const top = ancestors[0];

			if (top.type === 'post') {
				post = top.post;
			}
		}

		return (post.record as AppBskyFeedPost.Record).reply !== undefined;
	};

	return (
		<>
			<For each={thread().ancestors}>
				{(item) => {
					const type = item.type;

					if (type === 'post') {
						// Set estimateHeight for all except the last item.
						// As this is a one-time render only thing, we're not using the
						// second parameter in the <For> render function to get the index.
						const ancestors = thread().ancestors;

						const index = ancestors.indexOf(item);
						const end = index === ancestors.length - 1;

						return (
							<VirtualItem estimateHeight={!end ? 98 : undefined}>
								<PostThreadItem
									item={item}
									treeView={false}
									onReplyPublish={/* @once */ props.onReplyPublish}
								/>
							</VirtualItem>
						);
					}

					if (type === 'overflow') {
						return (
							<VirtualItem estimateHeight={44}>
								<OverflowThreadItem item={item} treeView={false} descendant={false} />
							</VirtualItem>
						);
					}

					return null;
				}}
			</For>

			<div
				ref={(node) => {
					if (isLoadingAncestor()) {
						// Mounted with placeholder that might contain ancestors, we only
						// want to scroll into view if user hasn't scrolled down.
						let scrollY = window.scrollY;

						createEffect((destroyed: boolean | undefined) => {
							if (!destroyed) {
								if (props.isPlaceholderData) {
									createEventListener(window, 'scroll', () => {
										scrollY = window.scrollY;
									});
								} else {
									if (scrollY === 0) {
										node.scrollIntoView({ behavior: 'instant' });
									}

									return true;
								}
							}
						});
					} else if (thread().ancestors.length !== 0) {
						// Mounted with ancestors loaded in.
						requestAnimationFrame(() => {
							node.scrollIntoView({ behavior: 'instant' });
						});
					}
				}}
				style={{ 'min-height': `calc(100dvh - 3.25rem)`, 'scroll-margin-top': '3.25rem' }}
			>
				<VirtualItem>
					<HighlightedPost
						post={thread().post}
						prev={thread().ancestors.length !== 0 || isLoadingAncestor()}
						onReplyPublish={/* @once */ props.onReplyPublish}
					/>
				</VirtualItem>

				<Keyed value={thread().preferences.treeView}>
					{(treeView) => (
						<>
							<Divider gutterBottom={treeView && `sm`} />
							<Key each={thread().descendants} by={(item) => item.id} equals={dequal}>
								{(item) => {
									const type = item().type;

									if (type === 'post') {
										return (
											<VirtualItem estimateHeight={98}>
												<PostThreadItem
													item={item() as PostDescendantItem}
													treeView={treeView}
													onReplyPublish={/* @once */ props.onReplyPublish}
												/>
											</VirtualItem>
										);
									}

									if (type === 'overflow') {
										return (
											<VirtualItem estimateHeight={44}>
												<OverflowThreadItem
													item={item() as OverflowDescendantItem}
													treeView={treeView}
													descendant
												/>
											</VirtualItem>
										);
									}

									return (
										<div class="flex px-3 hover:bg-contrast/sm">
											<ThreadLines lines={item().lines} />
											<div class="ml-2 py-3 text-sm">{type}</div>
										</div>
									);
								}}
							</Key>
						</>
					)}
				</Keyed>

				<div class="grid h-13 place-items-center">
					{!props.isPlaceholderData ? (
						<div class="h-1 w-1 rounded-full bg-contrast-muted"></div>
					) : (
						<CircularProgress />
					)}
				</div>
			</div>
		</>
	);
};
