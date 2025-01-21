import { For } from 'solid-js';

import { createQuery, keepPreviousData } from '@mary/solid-query';

import { useIsFocused } from '~/lib/navigation/router';
import { useAgent } from '~/lib/states/agent';

import ProfileItem from '~/components/profiles/profile-item';

import { useSearchBar } from '../context';

const HAS_FILTER_RE = /[a-z]:/;

const SearchAutocompletionView = () => {
	const { query } = useSearchBar();

	const { rpc } = useAgent();
	const isFocused = useIsFocused();

	const profiles = createQuery(() => {
		const $query = query();

		const trimmed = $query
			.trimEnd()
			.replace(/\p{P}+$/u, '')
			.toLowerCase();

		const isValidQuery = $query.length > 0 && $query.length < 128 && !HAS_FILTER_RE.test($query);

		return {
			queryKey: ['profile-autocomplete', trimmed],
			enabled: isValidQuery && isFocused(),
			placeholderData: isValidQuery ? keepPreviousData : undefined,
			async queryFn({ signal }) {
				const { data } = await rpc.get('app.bsky.actor.searchActorsTypeahead', {
					signal,
					params: {
						q: trimmed,
						limit: 10,
					},
				});

				return data;
			},
		};
	});

	return (
		<div hidden={!profiles.data?.actors.length}>
			<hr class="mx-4 my-3 border-outline" />
			<For each={profiles.data?.actors}>{(profile) => <ProfileItem item={profile} />}</For>
		</div>
	);
};

export default SearchAutocompletionView;
