import { For, Match, Switch, createEffect, createMemo, createSignal } from 'solid-js';

import { ClientResponseError } from '@atcute/client';
import type { AppBskyFeedDefs, AppBskyFeedPost, At, Brand } from '@atcute/client/lexicons';
import { useQueryClient } from '@mary/solid-query';

import {
	type OverflowDescendantItem,
	type PostDescendantItem,
	createThreadData,
} from '~/api/models/post-thread';
import { usePostThreadQuery } from '~/api/queries/post-thread';
import { createProfileQuery } from '~/api/queries/profile';
import { makeAtUri } from '~/api/types/at-uri';
import { isDid } from '~/api/types/identity';

import { history } from '~/globals/navigation';

import { createEventListener } from '~/lib/hooks/event-listener';
import { Key } from '~/lib/keyed';
import { useParams, useTitle } from '~/lib/navigation/router';
import { useSession } from '~/lib/states/session';
import { inject } from '~/lib/states/singleton';
import ModerationService from '~/lib/states/singletons/moderation';
import { truncateMiddle } from '~/lib/utils/strings';

import Button from '~/components/button';
import CircularProgress from '~/components/circular-progress';
import CircularProgressView from '~/components/circular-progress-view';
import Divider from '~/components/divider';
import ErrorView from '~/components/error-view';
import Keyed from '~/components/keyed';
import * as Page from '~/components/page';
import HighlightedPost from '~/components/threads/highlighted-post';
import OverflowThreadItem from '~/components/threads/overflow-thread-item';
import PostThreadItem from '~/components/threads/post-thread-item';
import ThreadLines from '~/components/threads/thread-lines';
import VirtualItem from '~/components/virtual-item';

const PostThreadPage = () => {
	const { didOrHandle, rkey } = useParams<{
		didOrHandle: At.Identifier;
		rkey: At.RecordKey;
	}>();

	const queryClient = useQueryClient();

	const uri = makeAtUri(didOrHandle, 'app.bsky.feed.post', rkey);
	const query = usePostThreadQuery(() => uri);

	useTitle(() => {
		const data = query.data;
		if (data && data.$type === 'app.bsky.feed.defs#threadViewPost') {
			const post = data.post;
			const author = post.author;
			const record = post.record as AppBskyFeedPost.Record;

			const authorTitle = `@${truncateMiddle(author.handle, 29).toLowerCase()}`;
			const postContent = record.text?.trim();

			const subtitle = `${authorTitle}: "${postContent}"`;

			return `${subtitle} — ${import.meta.env.VITE_APP_NAME}`;
		}

		return `Post — ${import.meta.env.VITE_APP_NAME}`;
	});

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
					{(err) => {
						if (err instanceof ClientResponseError) {
							if (err.error === 'NotFound') {
								return (
									<div class="px-4 py-3">
										<div class="rounded-md border border-outline p-3">
											<p class="text-sm text-contrast-muted">This post is unavailable</p>
										</div>
									</div>
								);
							}
						}

						return <ErrorView error={err} onRetry={() => query.refetch()} />;
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

										let did: At.Did | undefined;

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
									queryClient.setQueryData(['post-thread', makeAtUri(did, 'app.bsky.feed.post', rkey)], data);
									history.navigate(`/${did}/${rkey}`, { replace: true });
									return null;
								}}
							</Match>

							<Match
								when={(() => {
									const data = accessor();
									if (data.$type === 'app.bsky.feed.defs#blockedPost') {
										return data.author;
									}
								})()}
								keyed
							>
								{(raw) => {
									const did = raw.did;
									const blockedBy = raw.viewer?.blockedBy;

									const profile = createProfileQuery(() => did);

									return (
										<Switch>
											<Match when={profile.data}>
												{(data) => {
													const handle = createMemo(() => truncateMiddle(data().handle, 29));

													return (
														<div class="p-4">
															<div class="mb-4 text-sm">
																<p class="font-bold">
																	{blockedBy ? `@${handle()} blocked you` : `@${handle()} is blocked`}
																</p>
																<p class="text-pretty text-contrast-muted empty:hidden">
																	{blockedBy
																		? `You are blocked from viewing @${handle()}'s posts.`
																		: `You can no longer view @${handle()}'s posts, you need to unblock to continue viewing.`}
																</p>
															</div>

															<div class="flex flex-wrap gap-4">
																<Button href={`/${did}`} variant="primary">
																	View profile
																</Button>
															</div>
														</div>
													);
												}}
											</Match>

											<Match when={profile.error}>
												{(err) => <ErrorView error={err()} onRetry={() => profile.refetch()} />}
											</Match>

											<Match when>
												<CircularProgressView />
											</Match>
										</Switch>
									);
								}}
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
										onMainPostDelete={() => {
											queryClient.resetQueries({
												exact: true,
												queryKey: ['post-thread', result().post.uri],
											});
										}}
									/>
								)}
							</Match>
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
	onMainPostDelete?: () => void;
}) => {
	const { currentAccount } = useSession();

	const moderationOptions = inject(ModerationService);

	const [showTl, setShowTl] = createSignal(false);

	const thread = createMemo(() => {
		return createThreadData({
			thread: props.data,
			moderationOptions: moderationOptions(),
			selfDid: currentAccount?.did,
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
								<PostThreadItem item={item} treeView={false} />
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
						translate={showTl()}
						onTranslate={() => setShowTl(true)}
						onReplyPublish={/* @once */ props.onReplyPublish}
						onPostRedraft={/* @once */ props.onReplyPublish}
						onPostDelete={/* @once */ props.onMainPostDelete}
					/>
				</VirtualItem>

				<Keyed value={thread().preferences.treeView}>
					{(treeView) => (
						<>
							<Divider gutterBottom={treeView && `sm`} />
							<Key each={thread().descendants} by={(item) => item.id}>
								{(item) => {
									const type = item().type;

									if (type === 'post') {
										return (
											<VirtualItem estimateHeight={98}>
												<PostThreadItem
													item={item() as PostDescendantItem}
													treeView={treeView}
													onPostRedraft={/* @once */ props.onReplyPublish}
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
