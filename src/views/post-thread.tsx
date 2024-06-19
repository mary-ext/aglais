import { For, Match, Switch, createMemo, onMount } from 'solid-js';

import type { AppBskyFeedDefs, Brand } from '@mary/bluesky-client/lexicons';

import { createThreadData } from '~/api/models/post-thread';
import { usePostThreadQuery } from '~/api/queries/post-thread';

import { useParams } from '~/lib/navigation/router';
import { useModerationOptions } from '~/lib/states/moderation';
import { useSession } from '~/lib/states/session';

import Divider from '~/components/divider';
import Keyed from '~/components/keyed';
import * as Page from '~/components/page';
import VirtualItem from '~/components/virtual-item';

import HighlightedPost from '~/components/threads/highlighted-post';
import PostThreadItem from '~/components/threads/post-thread-item';
import ThreadLines from '~/components/threads/thread-lines';

const PostThreadPage = () => {
	const { didOrHandle, rkey } = useParams();

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
				<Match when={query.data}>
					{(accessor) => (
						<Switch>
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
								{(result) => <ThreadView data={result()} />}
							</Match>

							<Match when>{null}</Match>
						</Switch>
					)}
				</Match>
			</Switch>
		</>
	);
};

export default PostThreadPage;

const ThreadView = (props: { data: Brand.Union<AppBskyFeedDefs.ThreadViewPost> }) => {
	const { currentAccount } = useSession();
	const moderationOptions = useModerationOptions();

	const thread = createMemo(() => {
		return createThreadData({
			thread: props.data,
			moderationOptions: moderationOptions(),
			preferences: currentAccount?.preferences.threadView ?? {
				followsFirst: false,
				sort: 'most-likes',
				treeView: false,
			},
		});
	});

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

					return null;
				}}
			</For>

			<div
				ref={(node) => {
					onMount(() => {
						node.scrollIntoView({ behavior: 'instant' });
					});
				}}
				style={{ 'min-height': `calc(100vh - 3.25rem - 0.75rem)`, 'scroll-margin-top': '3.25rem' }}
			>
				<Keyed value={thread().post}>
					{(post) => (
						<VirtualItem>
							<HighlightedPost post={post} prev={/* @once */ thread().ancestors.length !== 0} />
						</VirtualItem>
					)}
				</Keyed>

				<Keyed value={thread().preferences.treeView}>
					{(treeView) => (
						<>
							<Divider gutterBottom={treeView && `sm`} />
							<For each={thread().descendants}>
								{(item) => {
									const type = item.type;

									if (type === 'post') {
										return (
											<VirtualItem estimateHeight={98}>
												<PostThreadItem item={item} treeView={treeView} />
											</VirtualItem>
										);
									}

									return (
										<div class="flex px-3 hover:bg-c-contrast-25">
											<ThreadLines lines={/* @once */ item.lines} />
											<div class="ml-2 py-3 text-sm">{type}</div>
										</div>
									);
								}}
							</For>
						</>
					)}
				</Keyed>
			</div>
		</>
	);
};
