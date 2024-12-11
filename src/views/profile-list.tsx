import { Match, Switch } from 'solid-js';

import { useQueryClient } from '@mary/solid-query';

import { createListMetaQuery } from '~/api/queries/list';
import { isDid, makeAtUri } from '~/api/utils/strings';

import { history } from '~/globals/navigation';

import { useParams, useTitle } from '~/lib/navigation/router';

import CircularProgressView from '~/components/circular-progress-view';
import ErrorView from '~/components/error-view';
import * as Page from '~/components/page';

const ListStubPage = () => {
	const { didOrHandle, rkey } = useParams();

	const queryClient = useQueryClient();

	const uri = makeAtUri(didOrHandle, 'app.bsky.graph.list', rkey);
	const meta = createListMetaQuery(() => uri);

	useTitle(() => `List — ${import.meta.env.VITE_APP_NAME}`);

	return (
		<>
			<Page.Header>
				<Page.HeaderAccessory>
					<Page.Back to={`/${didOrHandle}`} />
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

				<Match when={meta.data} keyed>
					{(list) => {
						const did = list.creator.did;
						const uri = list.uri;

						const purpose = list.purpose;

						if (!isDid(didOrHandle)) {
							queryClient.setQueryData(['list-meta', uri], list);
						}

						if (purpose === 'app.bsky.graph.defs#curatelist') {
							history.navigate(`/${did}/curation-lists/${rkey}`, { replace: true });
						} else if (purpose === 'app.bsky.graph.defs#modlist') {
							history.navigate(`/${did}/moderation-lists/${rkey}`, { replace: true });
						}

						return <div class="grid h-13 place-items-center text-sm">Unsupported list type</div>;
					}}
				</Match>

				<Match when>
					<CircularProgressView />
				</Match>
			</Switch>
		</>
	);
};

export default ListStubPage;
