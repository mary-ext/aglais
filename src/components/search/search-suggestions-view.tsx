import { Freeze, ShowFreeze } from '@mary/solid-freeze';

import { useSearchBar } from './context';
import AutocompletionView from './suggestions/autocompletion-view';
import TrendingSection from './suggestions/trending-section';

const SearchSuggestionsView = () => {
	const { query } = useSearchBar();

	return (
		<div class="relative">
			<Freeze freeze={query() !== ''}>
				<TrendingSection />
			</Freeze>

			<ShowFreeze when={query() !== ''}>
				<AutocompletionView />
			</ShowFreeze>

			<div class="mt-4"></div>
		</div>
	);
};

export default SearchSuggestionsView;
