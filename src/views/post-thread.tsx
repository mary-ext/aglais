import { For, Match, Switch, createMemo } from 'solid-js';

import type { AppBskyFeedDefs, Brand } from '@mary/bluesky-client/lexicons';

import {
	createThreadData,
	type OverflowDescendantItem,
	type PostDescendantItem,
} from '~/api/models/post-thread';
import { usePostThreadQuery } from '~/api/queries/post-thread';
import { dequal } from '~/api/utils/dequal';

import { Key } from '~/lib/keyed';
import { useParams } from '~/lib/navigation/router';
import { useModerationOptions } from '~/lib/states/moderation';
import { useSession } from '~/lib/states/session';

import Divider from '~/components/divider';
import Keyed from '~/components/keyed';
import * as Page from '~/components/page';
import VirtualItem from '~/components/virtual-item';

import HighlightedPost from '~/components/threads/highlighted-post';
import OverflowThreadItem from '~/components/threads/overflow-thread-item';
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
				sort: 'clout',
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
					requestAnimationFrame(() => {
						node.scrollIntoView({ behavior: 'instant' });
					});
				}}
				style={{ 'min-height': `calc(100dvh - 3.25rem - 0.75rem)`, 'scroll-margin-top': '3.25rem' }}
			>
				<VirtualItem>
					<HighlightedPost post={thread().post} prev={thread().ancestors.length !== 0} />
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
												<PostThreadItem item={item() as PostDescendantItem} treeView={treeView} />
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
					<div class="h-1 w-1 rounded-full bg-contrast-muted"></div>
				</div>
			</div>
		</>
	);
};
