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
	const { query, inputEl } = useSearchBar();

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

		const word = tok.value;

		if (word.startsWith('from:')) {
			const q = word.slice(5);

			if (!q || MAYBE_HANDLE_RE.test(q)) {
				return { type: SuggestType.ACTOR, tok, op: 'from', q };
			}
		}

		if (word.startsWith('to:')) {
			const q = word.slice(3);

			if (!q || MAYBE_HANDLE_RE.test(q)) {
				return {
					type: SuggestType.ACTOR,
					op: 'mentions',
					tok: tok,
					q,
				};
			}
		}

		if (word.startsWith('mentions:')) {
			const q = word.slice(9);

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
		const $inputEl = inputEl();
		if (!$inputEl) {
			return;
		}

		const $tokens = tokens();
		const position = getTokenTextPosition($tokens, token);
		if (!position) {
			return;
		}

		const [tokenIndex, start, end] = position;
		const nextToken = $tokens[tokenIndex + 1];

		let extra = 0;
		if (nextToken && nextToken.type === 'whitespace') {
			extra = nextToken.value.length;
		}

		replacement += ' ';

		$inputEl.focus();
		$inputEl.setSelectionRange(start, end + extra);

		document.execCommand('insertText', false, replacement);
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

const getTokenTextPosition = (
	tokens: Token[],
	targetToken: Token,
): [tokenIndex: number, start: number, end: number] | null => {
	const tokenIndex = tokens.indexOf(targetToken);
	if (tokenIndex === -1) return null;

	let start = 0;
	for (let i = 0; i < tokenIndex; i++) {
		start += tokens[i].value.length;
	}
	const end = start + targetToken.value.length;

	return [tokenIndex, start, end];
};
