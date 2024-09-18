import { Match, Switch } from 'solid-js';

import { useQueryClient } from '@mary/solid-query';

import { createFeedMetaQuery } from '~/api/queries/feed';
import { isDid } from '~/api/utils/strings';

import { history } from '~/globals/navigation';

import { useParams } from '~/lib/navigation/router';

import CircularProgressView from '~/components/circular-progress-view';
import ErrorView from '~/components/error-view';
import * as Page from '~/components/page';
import TimelineList from '~/components/timeline/timeline-list';

const FeedPage = () => {
	const { didOrHandle, rkey } = useParams();

	const queryClient = useQueryClient();

	const uri = `at://${didOrHandle}/app.bsky.feed.generator/${rkey}`;
	const meta = createFeedMetaQuery(() => uri);

	return (
		<>
			<Page.Header>
				<Page.HeaderAccessory>
					<Page.Back to={`/${didOrHandle}`} />
				</Page.HeaderAccessory>

				<Page.Heading
					title={(() => {
						const feed = meta.data;
						if (feed) {
							return feed.displayName;
						}

						return `Feed`;
					})()}
				/>
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
