import { createSignal } from 'solid-js';

import type { ActorIdentifier } from '@atcute/lexicons';
import { isDid } from '@atcute/lexicons/syntax';

import { createProfileQuery } from '~/api/queries/profile';

import { history } from '~/globals/navigation';

import { useParams } from '~/lib/navigation/router';
import { truncateMiddle } from '~/lib/utils/strings';

import SearchBar from '~/components/main/search-bar';
import * as Page from '~/components/page';
import { SearchBarProvider } from '~/components/search/context';
import SearchSuggestionsView from '~/components/search/search-suggestions-view';

const ProfileSearchPage = () => {
	const { didOrHandle } = useParams<{
		didOrHandle: ActorIdentifier;
	}>();

	const [query, setQuery] = createSignal('');
	const profile = createProfileQuery(() => didOrHandle);

	return (
		<SearchBarProvider
			query={query()}
			onQueryChange={setQuery}
			onSearch={(term) => {
				const $profile = profile.data;

				let handle: string | undefined;
				let did: string | undefined;

				if (isDid(didOrHandle)) {
					did = didOrHandle;
				} else {
					handle = didOrHandle;
				}

				if ($profile) {
					did = $profile.did;
					handle = $profile.handle;
				}

				let prefix: string;
				if (handle && handle !== 'invalid.handle') {
					prefix = `from:${handle}`;
				} else if (did) {
					prefix = did;
				} else {
					// TODO: clearly we should be ensuring that profile exists here.
					return;
				}

				term = `${prefix} ${term}`;
				history.navigate(`/search?q=${encodeURIComponent(term)}`);
			}}
		>
			<Page.Header>
				<Page.HeaderAccessory>
					<Page.Back to={`/${didOrHandle}`} />
				</Page.HeaderAccessory>

				<SearchBar autofocus />
			</Page.Header>

			<SearchSuggestionsView
				hideProfileSearch
				excludedOperators={['from']}
				placeholderMessage={(() => {
					const data = profile.data;
					if (data) {
						const handle = truncateMiddle(data.handle, 29);

						return (
							<>
								Search for <span class="font-medium">{/* @once */ `@${handle}`}</span>
								's posts
							</>
						);
					}

					return `Search for this user's posts`;
				})()}
			/>
		</SearchBarProvider>
	);
};

export default ProfileSearchPage;
