import { Match, Show, Switch } from 'solid-js';

import type { At } from '@atcute/client/lexicons';
import { useQueryClient } from '@mary/solid-query';

import { createFeedMetaQuery } from '~/api/queries/feed';
import { makeAtUri } from '~/api/types/at-uri';
import { isDid } from '~/api/types/identity';

import { openModal } from '~/globals/modals';
import { history } from '~/globals/navigation';

import { useParams, useTitle } from '~/lib/navigation/router';

import Avatar from '~/components/avatar';
import CircularProgressView from '~/components/circular-progress-view';
import ErrorView from '~/components/error-view';
import FeedInfoPrompt from '~/components/feeds/feed-info-prompt';
import FeedOverflowMenu from '~/components/feeds/feed-overflow-menu';
import IconButton from '~/components/icon-button';
import ChevronRightOutlinedIcon from '~/components/icons-central/chevron-right-outline';
import MoreHorizOutlinedIcon from '~/components/icons-central/more-horiz-outline';
import * as Page from '~/components/page';
import TimelineList from '~/components/timeline/timeline-list';

const FeedPage = () => {
	const { didOrHandle, rkey } = useParams<{
		didOrHandle: At.Identifier;
		rkey: At.RecordKey;
	}>();

	const queryClient = useQueryClient();

	const uri = makeAtUri(didOrHandle, 'app.bsky.feed.generator', rkey);
	const meta = createFeedMetaQuery(() => uri);

	useTitle(() => {
		const data = meta.data;
		if (data) {
			return `${data.displayName} — ${import.meta.env.VITE_APP_NAME}`;
		}

		return `Feed — ${import.meta.env.VITE_APP_NAME}`;
	});

	return (
		<>
			<Page.Header>
				<Page.HeaderAccessory>
					<Page.Back to={`/${didOrHandle}`} />
				</Page.HeaderAccessory>

				<Avatar type="generator" src={meta.data?.avatar} size={null} class="-ml-4 h-7 w-7" />
				{/* <Page.Heading
					title={(() => {
						const feed = meta.data;
						if (feed) {
							return feed.displayName;
						}

						return `Feed`;
					})()}
				/> */}

				<div class="flex min-w-0 grow">
					<button
						disabled={!meta.data}
						onClick={() => {
							const feed = meta.data;
							if (!feed) {
								return;
							}

							openModal(() => <FeedInfoPrompt feed={feed} />);
						}}
						class="-mx-2 flex items-center gap-1 overflow-hidden rounded px-2 py-1 hover:bg-contrast-hinted/md active:bg-contrast-hinted/md-pressed"
					>
						<span class="overflow-hidden text-ellipsis whitespace-nowrap text-base font-bold">
							{meta.data?.displayName.trim() || 'Feed'}
						</span>
						<ChevronRightOutlinedIcon class="-mr-1 shrink-0 rotate-90 text-lg text-contrast-muted" />
					</button>
				</div>

				<Show when={meta.data}>
					{(feed) => (
						<Page.HeaderAccessory>
							<IconButton
								title="More actions"
								icon={MoreHorizOutlinedIcon}
								onClick={(ev) => {
									const anchor = ev.currentTarget;
									openModal(() => <FeedOverflowMenu anchor={anchor} feed={feed()} />);
								}}
							/>
						</Page.HeaderAccessory>
					)}
				</Show>
			</Page.Header>

			<Switch>
				<Match when={meta.error} keyed>
					{(error) => <ErrorView error={error} onRetry={() => meta.refetch()} />}
				</Match>

				<Match when={isDid(didOrHandle)}>
					<TimelineList
						params={{
							type: 'feed',
							uri,
							showQuotes: true,
							showReplies: true,
							showReposts: true,
						}}
					/>
				</Match>

				<Match when={meta.data} keyed>
					{(feed) => {
						queryClient.setQueryData(['feed-meta', feed.uri], feed);
						history.navigate(`/${feed.creator.did}/feeds/${rkey}`, { replace: true });
						return null;
					}}
				</Match>

				<Match when>
					<CircularProgressView />
				</Match>
			</Switch>
		</>
	);
};

export default FeedPage;
