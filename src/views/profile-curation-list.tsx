import { Match, Switch } from 'solid-js';

import type { Did, RecordKey } from '@atcute/lexicons';

import { createListMetaQuery } from '~/api/queries/list';
import { makeAtUri } from '~/api/types/at-uri';

import { useParams, useTitle } from '~/lib/navigation/router';

import CircularProgressView from '~/components/circular-progress-view';
import ErrorView from '~/components/error-view';
import * as Page from '~/components/page';
import TimelineList from '~/components/timeline/timeline-list';

const CurationListPage = () => {
	const { did, rkey } = useParams<{
		did: Did;
		rkey: RecordKey;
	}>();

	const uri = makeAtUri(did, 'app.bsky.graph.list', rkey);
	const meta = createListMetaQuery(() => uri);

	useTitle(() => {
		const data = meta.data;
		if (data) {
			return `${data.name} — ${import.meta.env.VITE_APP_NAME}`;
		}

		return `List — ${import.meta.env.VITE_APP_NAME}`;
	});

	return (
		<>
			<Page.Header>
				<Page.HeaderAccessory>
					<Page.Back to={`/${did}`} />
				</Page.HeaderAccessory>

				<Page.Heading
					title={(() => {
						const list = meta.data;
						if (list) {
							return list.name;
						}

						return `List`;
					})()}
				/>
			</Page.Header>

			<Switch>
				<Match when={meta.error} keyed>
					{(error) => <ErrorView error={error} onRetry={() => meta.refetch()} />}
				</Match>

				<Match when={meta.data}>
					<TimelineList
						params={{
							type: 'list',
							uri,
							showQuotes: true,
							showReplies: true,
						}}
					/>
				</Match>

				<Match when>
					<CircularProgressView />
				</Match>
			</Switch>
		</>
	);
};

export default CurationListPage;
