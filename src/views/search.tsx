import { Match, Suspense, Switch, batch, createEffect, createMemo, lazy, onCleanup } from 'solid-js';

import { Freeze, ShowFreeze } from '@mary/solid-freeze';

import { hasModals } from '~/globals/modals';

import { tokenizeSearchQuery } from '~/lib/bsky/search';
import { createDerivedSignal } from '~/lib/hooks/derived-signal';
import { useModalClose } from '~/lib/hooks/modal-close';
import { asString, asStringUnion, useSearchParams } from '~/lib/hooks/search-params';
import { createFocusEffect, useTitle } from '~/lib/navigation/router';

import CircularProgressView from '~/components/circular-progress-view';
import IconButton from '~/components/icon-button';
import ArrowLeftOutlinedIcon from '~/components/icons-central/arrow-left-outline';
import MoreHorizOutlinedIcon from '~/components/icons-central/more-horiz-outline';
import SearchBar from '~/components/main/search-bar';
import * as Page from '~/components/page';
import { SearchBarProvider } from '~/components/search/context';
import SearchSuggestionsView from '~/components/search/search-suggestions-view';
import TabBar from '~/components/tab-bar';

const SearchFeedsLazy = lazy(() => import('~/components/search/search-feeds'));
const SearchPostsLazy = lazy(() => import('~/components/search/search-posts'));
const SearchProfilesLazy = lazy(() => import('~/components/search/search-profiles'));

const SearchPage = () => {
	const [params, setParams] = useSearchParams({
		q: asString.withDefault(''),
		t: asStringUnion(['top_posts', 'latest_posts', 'users', 'feeds']).withDefault('top_posts'),
	});

	const transformedSearch = createMemo(() => {
		return transformSearchQuery(params.q);
	});

	const [query, setQuery] = createDerivedSignal(() => params.q);
	const [isInputFocused, setIsInputFocused] = createDerivedSignal(() => (params.q, false));

	useTitle(() => `Search — ${import.meta.env.VITE_APP_NAME}`);

	createFocusEffect(() => {
		createEffect(() => {
			if (isInputFocused()) {
				window.scrollTo({ top: 0, behavior: 'instant' });

				useModalClose(
					null,
					() => setIsInputFocused(false),
					() => !hasModals(),
				);
			}
		});

		onCleanup(() => {
			setQuery(params.q);
			setIsInputFocused(false);
		});
	});

	return (
		<SearchBarProvider
			query={query()}
			onFocus={() => {
				setIsInputFocused(true);
			}}
			onQueryChange={(next) => {
				setQuery(next);
				setIsInputFocused(true);
			}}
			onSearch={(term) => {
				batch(() => {
					setParams({ q: term });
					setIsInputFocused(false);
				});
			}}
		>
			<Page.Header>
				<Page.HeaderAccessory>
					{!isInputFocused() ? (
						<Page.Back to="/explore" />
					) : (
						<IconButton
							title="Close search"
							icon={ArrowLeftOutlinedIcon}
							onClick={() => setIsInputFocused(false)}
						/>
					)}
				</Page.HeaderAccessory>

				<SearchBar />

				{!isInputFocused() && (
					<Page.HeaderAccessory>
						<IconButton icon={MoreHorizOutlinedIcon} title="Search actions" />
					</Page.HeaderAccessory>
				)}
			</Page.Header>

			<ShowFreeze when={isInputFocused()}>
				<SearchSuggestionsView />
			</ShowFreeze>

			<Freeze freeze={isInputFocused()}>
				<TabBar
					value={params.t}
					onChange={(next) => setParams({ t: next })}
					items={[
						{ value: 'top_posts', label: `Top` },
						{ value: 'latest_posts', label: `Latest` },
						{ value: 'users', label: `People` },
						{ value: 'feeds', label: `Feeds` },
					]}
				/>

				<Suspense fallback={<CircularProgressView />}>
					<Switch>
						<Match when={params.t === 'top_posts'}>
							<SearchPostsLazy q={transformedSearch()} sort="top" />
						</Match>

						<Match when={params.t === 'latest_posts'}>
							<SearchPostsLazy q={transformedSearch()} sort="latest" />
						</Match>

						<Match when={params.t === 'users'}>
							<SearchProfilesLazy q={transformedSearch()} />
						</Match>

						<Match when={params.t === 'feeds'}>
							<SearchFeedsLazy q={transformedSearch()} />
						</Match>
					</Switch>
				</Suspense>
			</Freeze>
		</SearchBarProvider>
	);
};

export default SearchPage;

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
