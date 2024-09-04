import { createMemo, Match, Show, Switch } from 'solid-js';

import type { At } from '@atcute/client/lexicons';

import {
	BlurContent,
	BlurMedia,
	BlurNone,
	getLocalizedLabel,
	GLOBAL_LABELS,
	PreferenceHide,
	PreferenceIgnore,
	PreferenceWarn,
	SeverityAlert,
	SeverityInform,
	SeverityNone,
	type LabelDefinition,
	type LabelPreference,
	type ModerationLabeler,
	type ModerationLabelerPreferences,
} from '~/api/moderation';
import { createLabelerMetaQuery } from '~/api/queries/labeler';

import { openModal, useModalContext } from '~/globals/modals';

import { formatAbsDateTime } from '~/lib/intl/time';
import { Key } from '~/lib/keyed';
import { mapDefined } from '~/lib/utils/misc';
import { useParams } from '~/lib/navigation/router';
import { useSession } from '~/lib/states/session';

import Avatar from '~/components/avatar';
import * as Boxed from '~/components/boxed';
import Button from '~/components/button';
import CircularProgressView from '~/components/circular-progress-view';
import ErrorView from '~/components/error-view';
import IconButton from '~/components/icon-button';
import ChevronRightOutlinedIcon from '~/components/icons-central/chevron-right-outline';
import CircleInfoOutlinedIcon from '~/components/icons-central/circle-info-outline';
import MoreHorizOutlinedIcon from '~/components/icons-central/more-horiz-outline';
import * as Menu from '~/components/menu';
import * as Page from '~/components/page';
import * as Prompt from '~/components/prompt';

import LabelerOverflowMenu from '~/components/settings/moderation/labeling/labeler-overflow-menu';

const ProfileLabelsPage = () => {
	const { did } = useParams();
	const { currentAccount } = useSession();

	const query = createLabelerMetaQuery(() => did as At.DID);

	const config = createMemo(() => {
		if (!currentAccount) {
			return;
		}

		const preferences = currentAccount.preferences;
		return preferences.moderation.labelers[did as At.DID];
	});

	return (
		<>
			<Page.Header>
				<Page.HeaderAccessory>
					<Page.Back to={`/${did}`} />
				</Page.HeaderAccessory>

				<Show when={query.data}>
					{(labeler) => (
						<>
							<Page.HeaderAccessory>
								<Show when={currentAccount && !config()}>
									<Button
										onClick={() => {
											openModal(() => (
												<Prompt.Confirm
													title={`Subscribe to @${labeler().profile.handle}?`}
													description="Labels applied to accounts and posts by this label provider will begin to take effect, and some content may be hidden as a result"
													confirmLabel="Subscribe"
													onConfirm={() => {
														if (config()) {
															return;
														}

														const preferences = currentAccount!.preferences;
														const labelers = preferences.moderation.labelers;

														labelers[did as At.DID] = {
															labels: {},
															privileged: false,
															redact: false,
														};
													}}
												/>
											));
										}}
										variant="primary"
										size="sm"
									>
										Subscribe
									</Button>
								</Show>

								<IconButton
									title="More actions"
									icon={MoreHorizOutlinedIcon}
									onClick={(ev) => {
										const anchor = ev.currentTarget;

										openModal(() => (
											<LabelerOverflowMenu
												anchor={anchor}
												labeler={labeler()}
												isSubscribed={config() !== undefined}
												onUnsubscribe={() => {
													openModal(() => (
														<Prompt.Confirm
															title={`Unsubscribe from @${labeler().profile.handle}?`}
															description="Labels applied to accounts and posts by this label provider no longer take effect. Saved preferences for this label provider will be lost."
															confirmLabel="Unsubscribe"
															danger
															onConfirm={() => {
																if (!config()) {
																	return;
																}

																const preferences = currentAccount!.preferences;
																const labelers = preferences.moderation.labelers;

																delete labelers[did as At.DID];
															}}
														/>
													));
												}}
											/>
										));
									}}
								/>
							</Page.HeaderAccessory>
						</>
					)}
				</Show>
			</Page.Header>

			<Switch>
				<Match when={query.data}>{(labeler) => <LabelerView data={labeler()} config={config()} />}</Match>

				<Match when={query.error}>
					{(error) => <ErrorView error={error()} onRetry={() => query.refetch()} />}
				</Match>

				<Match when>
					<CircularProgressView />
				</Match>
			</Switch>
		</>
	);
};

export default ProfileLabelsPage;

const LabelerView = (props: {
	data: ModerationLabeler;
	config: ModerationLabelerPreferences | undefined;
}) => {
	const { currentAccount } = useSession();

	const data = () => props.data;
	const profile = () => data().profile;

	const config = () => props.config;

	const definitions = createMemo(() => {
		const defs = data().definitions;

		return mapDefined(data().provides, (label) => {
			if (label[0] === '!') {
				return;
			}

			if (label in defs) {
				return {
					global: false,
					definition: defs[label],
				};
			} else if (label in GLOBAL_LABELS) {
				return {
					global: true,
					definition: GLOBAL_LABELS[label],
				};
			}
		});
	});

	const isSubscribed = createMemo(() => {
		return config() !== undefined;
	});

	return (
		<Boxed.Container>
			<div class="flex items-start gap-4 px-4">
				<Avatar type="labeler" src={profile().avatar} size={null} class="h-12 w-12" />

				<div class="mt-0.5 flex min-w-0 grow flex-col text-sm">
					<p class="overflow-hidden text-ellipsis text-base font-bold empty:hidden">
						{profile().displayName}
					</p>
					<p class="overflow-hidden text-ellipsis text-sm text-contrast-muted">{'@' + profile().handle}</p>
				</div>
			</div>

			<Boxed.Group>
				<Show when={profile().description?.trim()}>
					{(description) => (
						<Boxed.List>
							<div class="flex flex-col whitespace-pre-wrap px-4 py-3 text-left text-sm empty:hidden">
								{description()}
							</div>
						</Boxed.List>
					)}
				</Show>

				<Show when={config()} keyed>
					{(configuration) => (
						<Boxed.List>
							<Boxed.ToggleItem
								label="Trust this label provider"
								description="Don't downgrade default label configuration"
								enabled={configuration.privileged}
								onChange={(next) => (configuration.privileged = next)}
							/>

							<Boxed.ToggleItem
								label="Allow redactions from this label provider"
								description="Don't show content that has been flagged for takedown"
								enabled={configuration.redact}
								onChange={(next) => (configuration.redact = next)}
							/>
						</Boxed.List>
					)}
				</Show>
			</Boxed.Group>

			<Boxed.Group>
				<Boxed.GroupHeader>Available labels</Boxed.GroupHeader>
				<Boxed.GroupBlurb>
					{(() => {
						const indexedAt = data().indexedAt;

						return `Last updated: ${indexedAt !== undefined ? formatAbsDateTime(indexedAt) : 'N/A'}`;
					})()}
				</Boxed.GroupBlurb>

				<Boxed.List>
					<Key each={definitions()} by={(v) => v.definition}>
						{(accessor) => {
							// This is fine.
							const { global, definition } = accessor();
							const locale = getLocalizedLabel(definition);

							const selected = () => {
								if (global) {
									const mod = currentAccount!.preferences.moderation;

									return mod.labels[definition.i];
								} else {
									const conf = config();
									if (!conf) {
										return;
									}

									return conf.labels[definition.i];
								}
							};

							return (
								<button
									onClick={(ev) => {
										if (global || !isSubscribed()) {
											return;
										}

										const anchor = ev.currentTarget;

										openModal(() => (
											<LabelSelectMenu
												anchor={anchor}
												definition={definition}
												selected={selected()}
												privileged={config()?.privileged ?? false}
												onChange={(next) => {
													const conf = config();
													if (!conf) {
														return;
													}

													conf.labels[definition.i] = next;
												}}
											/>
										));
									}}
									class={
										`flex flex-col items-stretch px-4 py-3 text-left` +
										(!global && isSubscribed()
											? ` hover:bg-contrast/sm active:bg-contrast/sm-pressed`
											: ` cursor-auto select-text`)
									}
								>
									<div class="flex justify-between gap-4">
										<p class="min-w-0 break-words text-sm font-medium">{locale.n}</p>

										{isSubscribed() && (
											<span class="flex min-w-0 gap-1">
												<span class="min-w-0 break-words text-right text-de text-contrast-muted">
													{renderValueDef(definition, selected(), config()?.privileged ?? false)}
												</span>

												{!global && (
													<ChevronRightOutlinedIcon class="-mr-1 mt-px shrink-0 rotate-90 text-lg text-contrast-muted" />
												)}
											</span>
										)}
									</div>

									<p class="text-pretty break-words text-de text-contrast-muted empty:hidden">{locale.d}</p>

									{global && (
										<div class="mt-2 flex items-center gap-2 text-contrast-muted">
											<CircleInfoOutlinedIcon />
											<span class="text-de font-medium">
												Configured in{' '}
												<a href="/moderation" class="text-accent hover:underline">
													moderation settings
												</a>
											</span>
										</div>
									)}
								</button>
							);
						}}
					</Key>
				</Boxed.List>
			</Boxed.Group>
		</Boxed.Container>
	);
};

const LabelSelectMenu = (props: {
	anchor: HTMLElement;
	definition: LabelDefinition;
	selected: LabelPreference | undefined;
	privileged: boolean;
	onChange: (next: LabelPreference | undefined) => void;
}) => {
	const { close } = useModalContext();

	const definition = props.definition;
	const onChange = props.onChange;

	const item = (value: LabelPreference | undefined) => {
		return (
			<Menu.Item
				checked={props.selected === value}
				label={renderValueDef(definition, value, props.privileged)}
				onClick={() => {
					close();
					onChange(value);
				}}
			/>
		);
	};

	return (
		<Menu.Container anchor={props.anchor}>
			{/* @once */ item(undefined)}
			{/* @once */ item(PreferenceIgnore)}
			{/* @once */ canDisplayWarn(definition) && item(PreferenceWarn)}
			{/* @once */ item(PreferenceHide)}
		</Menu.Container>
	);
};

const canDisplayWarn = (def: LabelDefinition) => {
	return !(def.b === BlurNone && def.s === SeverityNone);
};

const renderValueDef = (
	def: LabelDefinition,
	pref: LabelPreference | undefined,
	privileged: boolean,
): string => {
	if (pref === undefined) {
		let defaultPref = def.d;

		if (!privileged && defaultPref === PreferenceHide) {
			defaultPref = PreferenceWarn;
		}

		return `Default (${renderValueDef(def, defaultPref, privileged)})`;
	}

	if (pref === PreferenceIgnore) {
		return `Off`;
	}
	if (pref === PreferenceHide) {
		return `Hide`;
	}

	if (def.b === BlurContent || def.b === BlurMedia || def.s === SeverityAlert) {
		return `Warn`;
	}

	if (def.s === SeverityInform) {
		return `Inform`;
	}

	return `Unknown`;
};
