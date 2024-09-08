import { createMemo, createSignal, Match, Switch } from 'solid-js';

import type { UnwrapArray } from '~/api/utils/types';

import { tokenizeSearchQuery } from '~/lib/bsky/search';

import IconButton from '~/components/icon-button';
import MoreHorizOutlinedIcon from '~/components/icons-central/more-horiz-outline';
import SearchBar from '~/components/main/search-bar';
import * as Page from '~/components/page';
import TabBar from '~/components/tab-bar';

import TimelineList from '~/components/feeds/timeline-list';

const SearchPage = () => {
	const searchParams = new URLSearchParams(location.search);

	const [search, setSearch] = createSignal(coerceString(searchParams.get('q')));
	const [type, setType] = createSignal(
		coerceStringArray(searchParams.get('t'), ['top_posts', 'latest_posts', 'profiles', 'feeds']),
	);

	const transformedSearch = createMemo(() => {
		return transformSearchQuery(search());
	});

	const updateHistoryEntry = () => {
		searchParams.set('q', search());
		searchParams.set('t', type());

		// We are intentionally altering global history, replacing the history entry
		// via app history causes this page to get reinstantiated.
		history.replaceState(history.state, '', location.pathname + `?` + searchParams.toString());
	};

	return (
		<>
			<Page.Header>
				<Page.HeaderAccessory>
					<Page.Back to="/explore" />
				</Page.HeaderAccessory>

				<SearchBar
					value={search()}
					onEnter={(next) => {
						if (next.trim() === '') {
							return;
						}

						setSearch(next);
						updateHistoryEntry();
					}}
				/>

				<Page.HeaderAccessory>
					<IconButton icon={MoreHorizOutlinedIcon} title="Search actions" />
				</Page.HeaderAccessory>
			</Page.Header>

			<TabBar
				value={type()}
				onChange={(next) => {
					setType(next);
					updateHistoryEntry();
				}}
				items={[
					{ value: 'top_posts', label: `Top` },
					{ value: 'latest_posts', label: `Latest` },
					{ value: 'profiles', label: `Profiles` },
					{ value: 'feeds', label: `Feeds` },
				]}
			/>

			<Switch>
				<Match when={type() === 'top_posts'}>
					<TimelineList params={{ type: 'search', query: transformedSearch(), sort: 'top' }} />
				</Match>

				<Match when={type() === 'latest_posts'}>
					<TimelineList params={{ type: 'search', query: transformedSearch(), sort: 'latest' }} />
				</Match>
			</Switch>
		</>
	);
};

export default SearchPage;

const coerceString = (val: string | null): string => {
	return typeof val === 'string' ? val : '';
};

const coerceStringArray = <const T extends [string, ...string[]]>(
	val: string | null,
	values: T,
): UnwrapArray<T> => {
	return (val === null || !values.includes(val as any) ? values[0] : val) as UnwrapArray<T>;
};

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

const transformSearchQuery = (q: string): string => {
	const tokens = tokenizeSearchQuery(q);
	const collator = new Intl.Collator('en');

	tokens.sort((a, b) => collator.compare(a, b));

	for (let idx = 0, len = tokens.length; idx < len; idx++) {
		const tok = tokens[idx];

		if (tok.charCodeAt(0) === 34) {
			continue;
		}

		const colon_index = tok.indexOf(':');
		if (colon_index === -1) {
			continue;
		}

		const operator = tok.slice(0, colon_index);
		const value = tok.slice(colon_index + 1);

		if (operator === 'since' || operator === 'until') {
			const match = DATE_RE.exec(value);
			if (match === null) {
				continue;
			}

			const s = operator === 'since';

			const [, year, month, day] = match;
			const date = new Date(+year, +month - 1, +day, s ? 0 : 23, s ? 0 : 59, s ? 0 : 59, s ? 0 : 999);

			if (Number.isNaN(date.getTime())) {
				continue;
			}

			tokens[idx] = `${operator}:${date.toISOString()}`;
		}
	}

	return tokens.join(' ');
};
