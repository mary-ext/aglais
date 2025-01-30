import { For } from 'solid-js';

import { createProfileAutocompleteQuery } from '~/api/queries/profile-autocomplete';

import { useIsFocused } from '~/lib/navigation/router';

import ProfileItem from '~/components/profiles/profile-item';

import { useSearchBar } from '../context';

const HAS_FILTER_RE = /[a-z]:/;

const SearchAutocompletionView = () => {
	const { query } = useSearchBar();

	const isFocused = useIsFocused();

	const profiles = createProfileAutocompleteQuery(query, {
		get enabled() {
			const $query = query();
			return isFocused() && $query.length > 0 && $query.length < 128 && !HAS_FILTER_RE.test($query);
		},
	});

	return (
		<div hidden={!profiles.data?.actors.length}>
			<hr class="mx-4 my-3 border-outline" />
			<For each={profiles.data?.actors}>{(profile) => <ProfileItem item={profile} />}</For>
		</div>
	);
};

export default SearchAutocompletionView;
