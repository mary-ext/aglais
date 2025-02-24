import { For, type JSX, Match, Show, Switch, createMemo } from 'solid-js';

import { type Token, tokenize } from '@atcute/bluesky-search-parser';
import { min } from '@mary/date-fns';

import { parseEndDate, parseStartDate, splitFilters } from '~/lib/bsky/search';
import { redirectBskyUrl } from '~/lib/redirector';

import MagnifyingGlassOutlinedIcon from '../icons-central/magnifying-glass-outline';

import { useSearchBar } from './context';
import DateAutocompletionView from './suggestions/date-autocompletion-view';
import FromActorAutocompletionView from './suggestions/from-actor-autocompletion-view';
import SearchAutocompletionView from './suggestions/search-autocompletion-view';

const MAYBE_HANDLE_RE = /^@?[a-zA-Z0-9-.]*$/;
const MAYBE_DATE_RE = /^[\d\-+.:Z]*$/;

const enum SuggestType {
	ACTOR,
	DATE,
	LANGUAGE,
	DOMAIN,
}

type SuggestMatch =
	| { type: SuggestType.ACTOR; op: string; q: string }
	| { type: SuggestType.DATE; op: string; q: string };

interface TokenPosition {
	token: Token;
	tokenIndex: number;
	relativePos: number;
}

interface Operator {
	name: string;
	type: SuggestType;
	hidden?: boolean;
	hideOn?: string[];
}

const operators: Operator[] = [
	{
		name: 'from',
		type: SuggestType.ACTOR,
	},
	{
		name: 'to',
		type: SuggestType.ACTOR,
		hidden: true,
		hideOn: ['mentions'],
	},
	{
		name: 'mentions',
		type: SuggestType.ACTOR,
		hideOn: ['to'],
	},

	{
		name: 'since',
		type: SuggestType.DATE,
	},
	{
		name: 'until',
		type: SuggestType.DATE,
	},

	{
		name: 'lang',
		type: SuggestType.LANGUAGE,
	},
	{
		name: 'domain',
		type: SuggestType.DOMAIN,
	},
];

export interface SearchSuggestionsViewProps {
	placeholderMessage?: JSX.Element;
	hideProfileSearch?: boolean;
	excludedOperators?: string[];
}

const SearchSuggestionsView = (props: SearchSuggestionsViewProps) => {
	const { query, inputEl, onSearch } = useSearchBar();

	const tokens = createMemo(() => tokenize(query()));

	const currentToken = createMemo((): TokenPosition | undefined => {
		const $tokens = tokens();
		const $inputEl = inputEl();

		const pos = ($inputEl && $inputEl.selectionEnd) || 0;
		let relativePos = 0;

		for (let idx = 0, len = $tokens.length; idx < len; idx++) {
			const token = $tokens[idx];
			const nextIndex = relativePos + token.value.length;

			if (pos >= relativePos && pos <= nextIndex) {
				return { token, tokenIndex: idx, relativePos: pos - relativePos };
			}

			relativePos = nextIndex;
		}

		return;
	});

	const matcher = createMemo((): SuggestMatch | undefined => {
		const $currentToken = currentToken();
		if (!$currentToken) {
			return;
		}

		const tok = $currentToken.token;
		if (tok.type !== 'word') {
			return;
		}

		const [op, q] = split(tok.value, ':', 2);
		if (q === undefined) {
			return;
		}

		const excluded = props.excludedOperators;
		if (excluded?.includes(op)) {
			return;
		}

		const def = operators.find((def) => def.name === op);
		if (!def) {
			return;
		}

		switch (def.type) {
			case SuggestType.ACTOR: {
				if (!q || MAYBE_HANDLE_RE.test(q)) {
					return { type: SuggestType.ACTOR, op, q };
				}

				break;
			}
			case SuggestType.DATE: {
				if (!q || MAYBE_DATE_RE.test(q)) {
					return { type: SuggestType.DATE, op, q };
				}

				break;
			}
		}
	});

	const operatorSuggestions = createMemo(() => {
		const token = currentToken()?.token;

		if (token?.type === 'quoted') {
			return [];
		}

		const [, present] = splitFilters(tokens());
		const excluded = props.excludedOperators;

		return operators.filter(({ name, hidden, hideOn }) => {
			if (hidden || excluded?.includes(name)) {
				return false;
			}

			if (present.has(name)) {
				return false;
			}

			if (hideOn?.some((x) => present.has(x))) {
				return false;
			}

			return !token || token.type !== 'word' || name.includes(token.value);
		});
	});

	const replaceCurrentToken = (replacement: string) => {
		const $inputEl = inputEl();

		const $tokens = tokens();
		const $currentToken = currentToken();

		if (!$inputEl) {
			return;
		}

		if (!$currentToken) {
			$inputEl.focus();
			$inputEl.setSelectionRange(0, $inputEl.value.length);

			document.execCommand('insertText', false, replacement);
			return;
		}

		const [start, end] = getSplicePosition($tokens, $currentToken);
		const nextToken = $tokens[$currentToken.tokenIndex + 1];
		const prevToken = $tokens[$currentToken.tokenIndex - 1];

		let extra = 0;
		if (nextToken && nextToken.type === 'whitespace') {
			extra = nextToken.value.length;
		}

		if (prevToken && prevToken.type !== 'whitespace') {
			replacement = ' ' + replacement;
		}

		$inputEl.focus();
		$inputEl.setSelectionRange(start, end + extra);

		document.execCommand('insertText', false, replacement);
	};

	return (
		<div class="relative flex flex-col pb-8">
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
								replaceCurrentToken(`${m.op}:${handle} `);
							}}
						/>
					)}
				</Match>

				<Match
					when={(() => {
						const match = matcher();
						if (match?.type === SuggestType.DATE) {
							return match;
						}
					})()}
				>
					{(match) => {
						const today = new Date();

						const cursor = createMemo((prev: Date | undefined) => {
							const parsed = parseStartDate(match().q);
							return parsed ?? prev;
						}, undefined);

						const constraints = createMemo(() => {
							const ctok = currentToken()?.token;
							const cop = match().op;

							let minDate: Date | undefined;
							let maxDate: Date | undefined;

							for (const token of tokens()) {
								if (token === ctok || token.type !== 'word') {
									continue;
								}

								const [op, q] = split(token.value, ':', 2);
								if (q === undefined || op !== (cop === 'since' ? 'until' : 'since')) {
									continue;
								}

								if (op === 'since') {
									minDate = parseEndDate(q) ?? undefined;
									break;
								}
								if (op === 'until') {
									maxDate = parseStartDate(q) ?? undefined;
									break;
								}
							}

							return {
								min: minDate,
								max: maxDate ? min(maxDate, today) : today,
							};
						});

						return (
							<DateAutocompletionView
								initialCursor={cursor()}
								minDate={constraints().min}
								maxDate={constraints().max}
								onCompletion={(next) => {
									const m = match();
									replaceCurrentToken(`${m.op}:${next} `);
								}}
							/>
						);
					}}
				</Match>

				<Match when>
					<Show
						when={query() !== ''}
						fallback={
							<div class="flex flex-col items-center justify-center gap-4 p-8 text-contrast-muted">
								<MagnifyingGlassOutlinedIcon class="text-5xl" />
								<p class="text-pretty text-center text-sm">
									{props.placeholderMessage ?? `Search for posts and users on Bluesky`}
								</p>
							</div>
						}
					>
						<button
							class="select-none overflow-hidden text-ellipsis whitespace-nowrap p-4 py-3 text-left text-sm text-contrast/85 outline-2 -outline-offset-2 outline-accent hover:bg-contrast/sm-pressed focus-visible:outline active:bg-contrast/md"
							onClick={() => onSearch(query())}
						>
							Search for <span class="font-medium text-contrast">{query()}</span>
						</button>

						<Show when={maybeMatchHandle(query())}>
							{(handle) => (
								<a
									href={`/${handle()}`}
									class="select-none overflow-hidden text-ellipsis whitespace-nowrap p-4 py-3 text-left text-sm text-contrast/85 outline-2 -outline-offset-2 outline-accent hover:bg-contrast/sm-pressed focus-visible:outline active:bg-contrast/md"
								>
									Go to <span class="font-medium text-contrast">{'@' + handle()}</span>
								</a>
							)}
						</Show>

						<Show when={maybeMatchDid(query())}>
							{(did) => (
								<a
									href={`/${did()}`}
									class="select-none overflow-hidden text-ellipsis whitespace-nowrap p-4 py-3 text-left text-sm text-contrast/85 outline-2 -outline-offset-2 outline-accent hover:bg-contrast/sm-pressed focus-visible:outline active:bg-contrast/md"
								>
									Go to <span class="font-medium text-contrast">{did()}</span>
								</a>
							)}
						</Show>

						<Show when={redirectBskyUrl(query())}>
							{(redirect) => (
								<a
									href={redirect()}
									class="select-none overflow-hidden text-ellipsis whitespace-nowrap p-4 py-3 text-left text-sm text-contrast/85 outline-2 -outline-offset-2 outline-accent hover:bg-contrast/sm-pressed focus-visible:outline active:bg-contrast/md"
								>
									Open URL in app
								</a>
							)}
						</Show>

						<Show when={!props.hideProfileSearch}>
							<SearchAutocompletionView />
						</Show>
					</Show>

					{operatorSuggestions().length !== 0 && (
						<div class="flex flex-col">
							<hr class="mx-4 my-3 border-outline" />

							<div class="mx-4">
								<span class="text-xs font-bold uppercase text-contrast/75">Search options</span>
							</div>

							<For each={operatorSuggestions()}>
								{({ name, type }) => {
									let typeWord = '';
									switch (type) {
										case SuggestType.ACTOR: {
											typeWord = '@user';
											break;
										}
										case SuggestType.DATE: {
											typeWord = 'yyyy-mm-dd';
											break;
										}
										case SuggestType.LANGUAGE: {
											typeWord = 'en';
											break;
										}
										case SuggestType.DOMAIN: {
											typeWord = 'example.com';
											break;
										}
									}

									return (
										<button
											onClick={() => {
												replaceCurrentToken(`${name}:`);
											}}
											class="flex select-none gap-2 overflow-hidden text-ellipsis whitespace-nowrap p-4 py-3 text-left text-sm text-contrast/85 outline-2 -outline-offset-2 outline-accent hover:bg-contrast/sm-pressed focus-visible:outline active:bg-contrast/md"
										>
											<span>{`${name}:`}</span>
											<span class="text-contrast-muted">{typeWord}</span>
										</button>
									);
								}}
							</For>
						</div>
					)}
				</Match>
			</Switch>
		</div>
	);
};

export default SearchSuggestionsView;

const getSplicePosition = (tokens: Token[], pos: TokenPosition): [start: number, end: number] => {
	const tokenIndex = pos.tokenIndex;

	let start = 0;
	for (let i = 0; i < tokenIndex; i++) {
		start += tokens[i].value.length;
	}

	const end = start + pos.token.value.length;

	return [start, end];
};

const split = (str: string, delimiter: string, limit: number): string[] => {
	const result: string[] = [];
	let start = 0;

	while (--limit) {
		const index = str.indexOf(delimiter, start);
		if (index === -1) {
			break;
		}

		result.push(str.slice(start, index));
		start = index + delimiter.length;
	}

	result.push(str.slice(start));
	return result;
};

const LIKELY_HANDLE_RE = /\b[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*(?:\.[a-zA-Z]{2,})\b/;
const maybeMatchHandle = (query: string): string | null => {
	const match = LIKELY_HANDLE_RE.exec(query);

	if (match) {
		return match[0];
	}

	return null;
};

const LIKELY_DID_RE = /\bdid:[a-z]+:[a-zA-Z0-9._:%-]*[a-zA-Z0-9._-]\b/;
const maybeMatchDid = (query: string): string | null => {
	const match = LIKELY_DID_RE.exec(query);

	if (match) {
		return match[0];
	}

	return null;
};
