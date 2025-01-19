import { Match, Switch, createMemo } from 'solid-js';

import { type Token, tokenize } from '@atcute/bluesky-search-parser';
import { Freeze, ShowFreeze } from '@mary/solid-freeze';

import { useSearchBar } from './context';
import FromActorAutocompletionView from './suggestions/from-actor-autocompletion-view';
import SearchAutocompletionView from './suggestions/search-autocompletion-view';
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

const MAYBE_HANDLE_RE = /^[a-zA-Z0-9-.]+$/;

const enum SuggestType {
	ACTOR,
	DATE,
}

type SuggestMatch =
	| { type: SuggestType.ACTOR; tok: Token; op: string; q: string }
	| { type: SuggestType.DATE; tok: Token; op: string };

const AutocompletionView = () => {
	const { query, inputEl, setQuery } = useSearchBar();

	const tokens = createMemo(() => tokenize(query()));

	const matcher = createMemo((): SuggestMatch | undefined => {
		const $tokens = tokens();
		const $inputEl = inputEl();

		if ($tokens.length === 0) {
			return;
		}

		// We only need the cursor position at the time of editing,
		// a bit annoying if it's reactive
		const cursor = ($inputEl && $inputEl.selectionStart) || 0;
		const tok = findTokenAtIndex($tokens, cursor);

		if (!tok || tok.type !== 'word') {
			return;
		}

		if (tok.value.startsWith('from:')) {
			const q = tok.value.slice(5);

			if (!q || MAYBE_HANDLE_RE.test(q)) {
				return { type: SuggestType.ACTOR, tok, op: 'from', q };
			}
		}

		if (tok.value.startsWith('mentions:')) {
			const q = tok.value.slice(9);

			if (!q || MAYBE_HANDLE_RE.test(q)) {
				return {
					type: SuggestType.ACTOR,
					op: 'mentions',
					tok: tok,
					q,
				};
			}
		}
	});

	const replace = (token: Token, replacement: string) => {
		let $tokens = tokens();

		const tokenIndex = $tokens.indexOf(token);
		if (tokenIndex === -1) {
			return;
		}

		const spliced: Token[] = [{ type: 'word', value: replacement }];

		if (!$tokens[tokenIndex + 1] || $tokens[tokenIndex + 1].type !== 'whitespace') {
			spliced.push({ type: 'whitespace', value: ' ' });
		}

		$tokens = $tokens.toSpliced(tokenIndex, 1, ...spliced);

		setQuery($tokens.map((token) => token.value).join(''));
		inputEl()!.focus();
	};

	return (
		<Switch>
			<Match
				when={(() => {
					const match = matcher();
					if (match?.type === SuggestType.ACTOR) {
						return match;
					}
				})()}
			>
				{(match) => (
					<FromActorAutocompletionView
						type={match().op}
						match={match().q}
						onCompletion={(handle) => {
							const m = match();
							replace(m.tok, `${m.op}:${handle}`);
						}}
					/>
				)}
			</Match>

			<Match when>
				<SearchAutocompletionView />
			</Match>
		</Switch>
	);
};

const findTokenAtIndex = (tokens: Token[], index: number): Token | null => {
	let currentIndex = 0;

	for (const token of tokens) {
		const nextIndex = currentIndex + token.value.length;

		if (index >= currentIndex && index <= nextIndex) {
			return token;
		}

		currentIndex = nextIndex;
	}

	return null; // Index not within any token
};
