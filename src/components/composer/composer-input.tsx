import { autoPlacement, autoUpdate, offset, shift, size } from '@floating-ui/dom';
import { useFloating } from 'solid-floating-ui';
import {
	For,
	type JSX,
	Match,
	Switch,
	createEffect,
	createMemo,
	createRenderEffect,
	createResource,
	createSignal,
} from 'solid-js';

import type { AppBskyActorDefs } from '@atcute/client/lexicons';

import { safeUrlParse } from '~/api/utils/strings';

import { createDebouncedValue } from '~/lib/hooks/debounced-value';
import { createEventListener } from '~/lib/hooks/event-listener';
import { useTextareaAutosize } from '~/lib/hooks/textarea-autosize';
import { isCtrlKeyPressed } from '~/lib/interaction';
import { useAgent } from '~/lib/states/agent';
import { assert } from '~/lib/utils/invariant';

import Avatar, { getUserAvatarType } from '../avatar';
import CircularProgress from '../circular-progress';

import type { ParsedRichText } from './lib/state';

export interface ComposerInputProps {
	ref?: (el: HTMLTextAreaElement) => void;

	value: string;
	rt: ParsedRichText;
	onChange: (next: string) => void;
	onSubmit?: () => void;

	minRows?: number;
	placeholder?: string;
}

const enum Suggestion {
	MENTION,
}

interface MentionSuggestionItem {
	type: Suggestion.MENTION;
	data: AppBskyActorDefs.ProfileViewBasic;
}

type SuggestionItem = MentionSuggestionItem;

const MENTION_AUTOCOMPLETE_RE = /(?<=^|\s)@([a-zA-Z0-9-.]+)$/;
const TRIM_MENTION_RE = /[.]+$/;

const ComposerInput = (props: ComposerInputProps) => {
	let textarea: HTMLTextAreaElement | undefined;
	let renderer: HTMLDivElement | undefined;
	let shiftKeyHeld = false;

	const onChange = props.onChange;
	const onSubmit = props.onSubmit;

	const { rpc } = useAgent();

	const [inputCursor, setInputCursor] = createSignal<number>();
	const [menuSelection, setMenuSelection] = createSignal<number>();

	// `candidateMatch` needs the value after it has been committed to DOM
	const debouncedValue = createDebouncedValue(() => props.value, 0);

	const candidateMatch = createMemo(() => {
		const $cursor = inputCursor();

		if ($cursor == null) {
			return null;
		}

		const $val = debouncedValue();
		return $val.length === $cursor ? $val : $val.slice(0, $cursor);
	});

	const matchedCompletion = createMemo(() => {
		const $candidate = candidateMatch();

		if ($candidate === null) {
			return;
		}

		let match: RegExpExecArray | null;
		let type: Suggestion;

		if ((match = MENTION_AUTOCOMPLETE_RE.exec($candidate))) {
			type = Suggestion.MENTION;
		} else {
			return;
		}

		const start = match.index!;
		const length = match[0].length;

		const matched = match[1].toLowerCase();

		const rangeStart = findNodePosition(renderer!, start);
		const rangeEnd = findNodePosition(renderer!, start + length);

		let range: Range | undefined;
		if (rangeStart && rangeEnd) {
			range = new Range();
			range.setStart(rangeStart.node, rangeStart.position);
			range.setEnd(rangeEnd.node, rangeEnd.position);
		}

		return {
			type: type,
			range: range,
			index: start,
			length: length,
			query: type === Suggestion.MENTION ? matched.replace(TRIM_MENTION_RE, '') : matched,
		};
	});

	const debouncedMatchedCompletion = createDebouncedValue(
		matchedCompletion,
		500,
		(a, b) => a?.query === b?.query && a?.type === b?.type,
	);

	const [suggestions] = createResource(
		debouncedMatchedCompletion,
		async (match): Promise<SuggestionItem[]> => {
			const type = match.type;

			const MATCH_LIMIT = 5;

			if (type === Suggestion.MENTION) {
				const response = await rpc.get('app.bsky.actor.searchActorsTypeahead', {
					params: {
						q: match.query,
						limit: MATCH_LIMIT,
					},
				});

				return response.data.actors.map((item) => ({ type: Suggestion.MENTION, data: item }));
			}

			assert(false, `expected match`);
		},
	);

	const [floating, setFloating] = createSignal<HTMLElement>();
	const position = useFloating(() => matchedCompletion()?.range, floating, {
		strategy: 'fixed',
		placement: 'bottom-start',
		middleware: [
			shift({ padding: 12 }),
			autoPlacement({
				allowedPlacements: ['top-start', 'top-end', 'bottom-start', 'bottom-end'],
			}),
			offset({ mainAxis: 8 }),
			size({
				apply({ elements }) {
					Object.assign(elements.floating.style, {
						maxWidth: `${textarea!.offsetWidth}px`,
					});
				},
			}),
		],
		whileElementsMounted: autoUpdate,
	});

	const acceptSuggestion = (item: SuggestionItem) => {
		const $match = matchedCompletion();
		const type = item.type;

		if (!$match) {
			return;
		}

		let text: string;
		if (type === Suggestion.MENTION) {
			text = `@${item.data.handle} `;
		} else {
			assert(false, `expected type`);
		}

		textarea!.focus();
		textarea!.setSelectionRange($match.index, $match.index + $match.length);
		document.execCommand('insertText', false, text);
	};

	const handleInputSelection = () => {
		const start = textarea!.selectionStart;
		const end = textarea!.selectionEnd;

		setInputCursor(start === end ? start : undefined);
	};

	createEventListener(document, 'selectionchange', () => {
		if (document.activeElement !== textarea) {
			return;
		}

		handleInputSelection();
	});

	return (
		<div class="group relative z-0 text-base">
			<div
				ref={(node) => {
					renderer = node;
				}}
				inert
				innerHTML={buildHtml(props.rt)}
				class={`absolute inset-0 z-0 whitespace-pre-wrap break-words` + ` py-1.5`}
			></div>

			<textarea
				ref={(node) => {
					textarea = node;

					props.ref?.(node);

					createRenderEffect(() => {
						useTextareaAutosize(node, () => props.value, {
							minRows: props.minRows,
						});
					});
				}}
				value={props.value}
				placeholder={props.placeholder}
				class={
					`relative z-10 block w-full resize-none overflow-hidden bg-transparent text-transparent caret-contrast outline-none placeholder:text-contrast-muted` +
					` py-1.5`
				}
				onInput={(ev) => {
					onChange(ev.target.value);
					setMenuSelection(undefined);
				}}
				onKeyDown={(ev) => {
					const key = ev.key;

					if (matchedCompletion()) {
						const $sel = menuSelection();
						const $suggestions = !suggestions.error && suggestions();

						if (key === 'Escape') {
							setInputCursor(undefined);
						} else if ($suggestions) {
							if (key === 'ArrowUp') {
								ev.preventDefault();

								if ($suggestions.length > 0) {
									setMenuSelection($sel == null || $sel <= 0 ? $suggestions.length - 1 : $sel - 1);
								} else {
									setMenuSelection(undefined);
								}
							} else if (key === 'ArrowDown') {
								ev.preventDefault();

								if ($suggestions.length > 0) {
									setMenuSelection(($sel == null || $sel >= $suggestions.length - 1 ? -1 : $sel) + 1);
								} else {
									setMenuSelection(undefined);
								}
							} else if (key === 'Enter') {
								ev.preventDefault();

								if ($sel != null) {
									const item = $suggestions[$sel];

									if (item) {
										acceptSuggestion(item);
									}
								}
							}
						}

						return;
					}

					if (ev.shiftKey) {
						shiftKeyHeld = true;
					}

					if (key === 'Backspace') {
						setTimeout(handleInputSelection, 0);
					}

					if (onSubmit && key === 'Enter' && isCtrlKeyPressed(ev)) {
						ev.preventDefault();
						onSubmit();

						return;
					}
				}}
				onKeyUp={(ev) => {
					if (!ev.shiftKey) {
						shiftKeyHeld = false;
					}
				}}
				onPaste={(ev) => {
					const start = textarea!.selectionStart;
					const end = textarea!.selectionEnd;

					const clipboardData = ev.clipboardData;
					if (!clipboardData || shiftKeyHeld || start === end) {
						return;
					}

					const plain = clipboardData.getData('text/plain');
					const url = plain ? safeUrlParse(plain) : null;

					if (url) {
						const slice = props.value.slice(start, end);

						ev.preventDefault();
						document.execCommand('insertText', false, `[${slice}](${plain})`);
					}
				}}
			/>

			{matchedCompletion() && (
				<ul
					ref={setFloating}
					class="fixed z-40 hidden w-full min-w-44 overflow-auto rounded-md border border-outline bg-background shadow-md group-focus-within:block sm:w-max"
					style={{ top: `${position.y ?? 0}px`, left: `${position.x ?? 0}px` }}
				>
					<Switch>
						<Match when={suggestions.loading || (matchedCompletion() && !debouncedMatchedCompletion())}>
							<div class="flex h-14 w-full items-center justify-center">
								<CircularProgress />
							</div>
						</Match>

						<Match when={!suggestions.error && suggestions()}>
							{(suggestions) => (
								<For
									each={suggestions()}
									fallback={
										<div class="px-4 py-2">
											<span class="text-de text-contrast-muted">
												No {renderSuggestionLabel(matchedCompletion()!.type)} found matching this query
											</span>
										</div>
									}
								>
									{(item, index) => {
										const selected = () => menuSelection() === index();
										const type = item.type;

										let node: JSX.Element;
										if (type === Suggestion.MENTION) {
											const user = item.data;

											node = (
												<div class="contents">
													<Avatar type={/* @once */ getUserAvatarType(user)} src={/* @once */ user.avatar} />

													<div class="flex grow flex-col">
														<span class="line-clamp-1 break-all text-sm font-bold">
															{/* @once */ user.displayName || user.handle}
														</span>
														<span class="line-clamp-1 shrink-0 break-all text-de text-contrast-muted">
															@{/* @once */ user.handle}
														</span>
													</div>
												</div>
											);
										} else {
											assert(false, `expected type`);
										}

										return (
											<li
												ref={(node) => {
													createEffect(() => {
														if (selected()) {
															node.scrollIntoView({ block: 'center' });
														}
													});
												}}
												role="option"
												tabIndex={-1}
												aria-selected={selected()}
												onClick={() => {
													acceptSuggestion(item);
												}}
												class={
													`flex cursor-pointer items-center gap-4 px-3 py-2 hover:bg-contrast/sm active:bg-contrast/sm-pressed` +
													(selected()
														? ` bg-contrast/md`
														: ` hover:bg-contrast/md active:bg-contrast/sm-pressed`)
												}
											>
												{node}
											</li>
										);
									}}
								</For>
							)}
						</Match>
					</Switch>
				</ul>
			)}
		</div>
	);
};

export default ComposerInput;

const renderSuggestionLabel = (suggestion: Suggestion) => {
	if (suggestion === Suggestion.MENTION) {
		return `users`;
	}

	return `N/A`;
};

const escape = (str: string, attr: boolean) => {
	let escaped = '';
	let last = 0;

	for (let idx = 0, len = str.length; idx < len; idx++) {
		const char = str.charCodeAt(idx);

		if (char === 38 || (attr ? char === 34 : char === 60)) {
			escaped += str.substring(last, idx) + ('&#' + char + ';');
			last = idx + 1;
		}
	}

	return escaped + str.substring(last);
};

const buildHtml = ({ tokens }: ParsedRichText) => {
	let str = '';

	for (let i = 0, ilen = tokens.length; i < ilen; i++) {
		const token = tokens[i];

		const type = token.type;

		if (type === 'autolink') {
			str += `<span class=text-accent>` + escape(token.url, false) + `</span>`;
		} else if (type === 'mention') {
			str += `<span class=text-accent>@` + escape(token.handle, false) + `</span>`;
		} else if (type === 'emote') {
			str +=
				`<span class=text-contrast-muted>:</span>` +
				`<span class=text-accent>` +
				escape(token.name, false) +
				`</span>` +
				`<span class=text-contrast-muted>:</span>`;
		} else if (type === 'topic') {
			str += `<span class=text-accent>@` + escape(token.name, false) + `</span>`;
		} else if (type === 'link') {
			str +=
				`<span class=opacity-50>[</span>` +
				`<span class=text-accent>${escape(token.text, false)}</span>` +
				`<span class=opacity-50>](${escape(token.url, false)})</span>`;
		} else if (type === 'escape') {
			str += `<span class=opacity-50>\\</span>` + escape(token.escaped, false);
		} else {
			str += escape(token.raw, false);
		}
	}

	return str;
};

const findNodePosition = (node: Node, position: number): { node: Node; position: number } | undefined => {
	if (node.nodeType === Node.TEXT_NODE) {
		return { node, position };
	}

	const children = node.childNodes;
	for (let idx = 0, len = children.length; idx < len; idx++) {
		const child = children[idx];
		const textContentLength = child.textContent!.length;

		if (position <= textContentLength!) {
			return findNodePosition(child, position);
		}

		position -= textContentLength!;
	}

	return;
};
