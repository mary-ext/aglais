import { For, Match, Switch, batch, createEffect, createMemo, createSignal, untrack } from 'solid-js';

import type { AppBskyFeedThreadgate, Brand } from '@atcute/client/lexicons';

import { createMyListsQuery } from '~/api/queries/my-lists';
import { dequal } from '~/api/utils/dequal';
import type { UnwrapArray } from '~/api/utils/types';

import { useModalContext } from '~/globals/modals';

import { createDerivedSignal } from '~/lib/hooks/derived-signal';
import type { PostgateState, ThreadgateState } from '~/lib/preferences/snippets/composer';

import * as Boxed from '~/components/boxed';
import Button from '~/components/button';
import CircularProgressView from '~/components/circular-progress-view';
import * as Dialog from '~/components/dialog';

type ThreadRule = UnwrapArray<ThreadgateState['allow']>;
type EmbedRule = UnwrapArray<PostgateState['embeddingRules']>;

export interface ComposedInteractionDialogProps {
	initialState: { threadgate: ThreadgateState; postgate: PostgateState };
	onApply: (next: { threadgate: ThreadgateState; postgate: PostgateState }) => void;
}

const enum ThreadRulePreset {
	EVERYONE,
	NO_ONE,
	CUSTOM,
}

const ComposedInteractionDialog = ({ initialState, onApply }: ComposedInteractionDialogProps) => {
	const { close } = useModalContext();

	const [threadRules, setThreadRules] = createSignal(initialState.threadgate.allow);
	const [threadRulesPreset, setThreadRulesPreset] = createDerivedSignal(() => {
		const rules = threadRules();

		if (rules === undefined) {
			return ThreadRulePreset.EVERYONE;
		}

		if (rules.length === 0) {
			return ThreadRulePreset.NO_ONE;
		}

		return ThreadRulePreset.CUSTOM;
	});

	const [embeddingRules, _setEmbeddingRules] = createSignal(initialState.postgate.embeddingRules);

	const lists = createMyListsQuery('curation');

	const isDisabled = createMemo(() => {
		const $threadRulesPreset = threadRulesPreset();

		const $threadRules = threadRules();
		const $embeddingRules = embeddingRules();

		return (
			(dequal($threadRules, initialState.threadgate.allow) &&
				dequal($embeddingRules, initialState.postgate.embeddingRules)) ||
			($threadRulesPreset === ThreadRulePreset.CUSTOM &&
				($threadRules === undefined || $threadRules.length === 0))
		);
	});

	const setCustomThreadRules = (next: ThreadgateState['allow']) => {
		batch(() => {
			setThreadRules(next);
			setThreadRulesPreset(ThreadRulePreset.CUSTOM);
		});
	};

	const setEmbeddingRules = (next: PostgateState['embeddingRules']) => {
		if (next && next.length === 0) {
			next = undefined;
		}

		_setEmbeddingRules(next);
	};

	const apply = () => {
		onApply({
			threadgate: {
				allow: threadRules(),
			},
			postgate: {
				embeddingRules: embeddingRules(),
			},
		});

		close();
	};

	const hasThreadRule = (predicate: ThreadRule): boolean => {
		return !!threadRules()?.find((rule) => dequal(rule, predicate));
	};
	const hasEmbedRule = (predicate: EmbedRule): boolean => {
		return !!embeddingRules()?.find((rule) => dequal(rule, predicate));
	};

	// the only time we can prune dead lists is here.
	createEffect(() => {
		if (!lists.data) {
			return;
		}

		const uris = lists.data.map((list) => list.uri);

		const rules = untrack(threadRules);
		const newRules = rules?.filter((rule) => {
			return rule.$type !== 'app.bsky.feed.threadgate#listRule' || uris.includes(rule.list);
		});

		if (!dequal(rules, newRules)) {
			setThreadRules(newRules);
		}
	});

	return (
		<>
			<Dialog.Backdrop />
			<Dialog.Container maxWidth="sm" fullHeight>
				<Dialog.Header>
					<Dialog.HeaderAccessory>
						<Dialog.Close />
					</Dialog.HeaderAccessory>

					<Dialog.Heading title="Interaction settings" />

					<Dialog.HeaderAccessory>
						<Button disabled={isDisabled()} onClick={apply} variant="primary" size="sm">
							Save
						</Button>
					</Dialog.HeaderAccessory>
				</Dialog.Header>

				<Dialog.Body unpadded>
					<Boxed.Container>
						<Boxed.Group>
							<Boxed.GroupHeader>Quote settings</Boxed.GroupHeader>

							<Boxed.List>
								<Boxed.ToggleItem
									label="Allow quote posts"
									enabled={!hasEmbedRule({ $type: 'app.bsky.feed.postgate#disableRule' })}
									onChange={(next) => {
										// This is flipped
										if (next) {
											setEmbeddingRules(
												embeddingRules()?.filter(
													(rule) => rule.$type !== 'app.bsky.feed.postgate#disableRule',
												),
											);
										} else {
											setEmbeddingRules([
												...(embeddingRules() ?? []),
												{ $type: 'app.bsky.feed.postgate#disableRule' },
											]);
										}
									}}
								/>
							</Boxed.List>
						</Boxed.Group>

						<Boxed.Group>
							<Boxed.GroupHeader>Reply settings</Boxed.GroupHeader>

							<Boxed.List>
								<Boxed.RadioItem
									label="Everyone can reply"
									enabled={threadRulesPreset() === ThreadRulePreset.EVERYONE}
									onChange={() => setThreadRules(undefined)}
								/>

								<Boxed.RadioItem
									label="No one can reply"
									enabled={threadRulesPreset() === ThreadRulePreset.NO_ONE}
									onChange={() => setThreadRules([])}
								/>

								<Boxed.RadioItem
									label="Custom"
									enabled={threadRulesPreset() === ThreadRulePreset.CUSTOM}
									onChange={() => setCustomThreadRules([])}
								/>
							</Boxed.List>

							<Boxed.GroupBlurb>Alternatively, combine these options:</Boxed.GroupBlurb>

							<Boxed.List>
								<Boxed.CheckItem
									label="Followed users"
									enabled={hasThreadRule({ $type: 'app.bsky.feed.threadgate#followingRule' })}
									onChange={(next) => {
										if (next) {
											setCustomThreadRules([
												...(threadRules() ?? []),
												{ $type: 'app.bsky.feed.threadgate#followingRule' },
											]);
										} else {
											setCustomThreadRules(
												threadRules()?.filter(
													(rule) => rule.$type !== 'app.bsky.feed.threadgate#followingRule',
												),
											);
										}
									}}
								/>

								<Boxed.CheckItem
									label="Mentioned users"
									enabled={hasThreadRule({ $type: 'app.bsky.feed.threadgate#mentionRule' })}
									onChange={(next) => {
										if (next) {
											setCustomThreadRules([
												...(threadRules() ?? []),
												{ $type: 'app.bsky.feed.threadgate#mentionRule' },
											]);
										} else {
											setCustomThreadRules(
												threadRules()?.filter(
													(rule) => rule.$type !== 'app.bsky.feed.threadgate#mentionRule',
												),
											);
										}
									}}
								/>
							</Boxed.List>

							<Switch>
								<Match when={lists.isPending}>
									<CircularProgressView />
								</Match>

								<Match when={lists.data?.length}>
									<Boxed.List>
										<For each={lists.data}>
											{(list) => {
												const rule: Brand.Union<AppBskyFeedThreadgate.ListRule> = {
													$type: 'app.bsky.feed.threadgate#listRule',
													list: list.uri,
												};

												return (
													<Boxed.CheckItem
														label={/* @once */ `Users in "${list.name}"`}
														enabled={hasThreadRule(rule)}
														onChange={(next) => {
															if (next) {
																setCustomThreadRules([...(threadRules() ?? []), rule]);
															} else {
																setCustomThreadRules(threadRules()?.filter((r) => !dequal(r, rule)));
															}
														}}
													/>
												);
											}}
										</For>
									</Boxed.List>
								</Match>
							</Switch>
						</Boxed.Group>
					</Boxed.Container>
				</Dialog.Body>
			</Dialog.Container>
		</>
	);
};

export default ComposedInteractionDialog;
