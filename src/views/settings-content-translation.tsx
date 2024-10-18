import { For } from 'solid-js';

import { googleLanguages } from '~/api/basa/languages';

import { openModal } from '~/globals/modals';

import { getEnglishLanguageName } from '~/lib/intl/languages';
import { useSession } from '~/lib/states/session';
import { mapDefined } from '~/lib/utils/misc';

import * as Boxed from '~/components/boxed';
import IconButton from '~/components/icon-button';
import AddOutlinedIcon from '~/components/icons-central/add-outline';
import TrashOutlinedIcon from '~/components/icons-central/trash-outline';
import * as Page from '~/components/page';
import * as Prompt from '~/components/prompt';
import AddBasaInstancePrompt from '~/components/settings/content-translation/add-basa-instance-prompt';

const TranslationSettingsPage = () => {
	const { currentAccount } = useSession();

	const preferences = currentAccount!.preferences;
	const translationPrefs = preferences.translation;

	const languageOptions: Boxed.SelectItemOption<string>[] = [
		{
			value: 'system',
			label: 'System language',
		},
		...mapDefined(googleLanguages, (code): Boxed.SelectItemOption<string> | undefined => {
			const eng = getEnglishLanguageName(code);
			if (!eng) {
				return;
			}

			return {
				value: code,
				label: eng,
			};
		}),
	];

	return (
		<>
			<Page.Header>
				<Page.HeaderAccessory>
					<Page.Back to="/settings/content" />
				</Page.HeaderAccessory>

				<Page.Heading title="Content translation" />
			</Page.Header>

			<Boxed.Container>
				<Boxed.Group>
					<Boxed.List>
						<Boxed.ToggleItem
							label="Enable content translations"
							enabled={translationPrefs.enabled}
							onChange={(next) => (translationPrefs.enabled = next)}
						/>
					</Boxed.List>

					<Boxed.GroupBlurb>
						Makes use of Basa proxy instances that will forward your requests to Google Translate. Please read
						the privacy policies of the services and proxies before use.
					</Boxed.GroupBlurb>
				</Boxed.Group>

				<Boxed.Group>
					<Boxed.GroupHeader>Proxy instances</Boxed.GroupHeader>

					<Boxed.List>
						<For
							each={translationPrefs.instances}
							fallback={<div class="px-4 py-3 text-sm text-contrast-muted">No instances added yet</div>}
						>
							{(href) => (
								<div class="flex items-center justify-between px-4 py-3">
									<span class="text-ellipsis whitespace-nowrap text-sm font-medium">{href}</span>

									<IconButton
										icon={TrashOutlinedIcon}
										title="Remove this instance"
										onClick={() => {
											openModal(() => (
												<Prompt.Confirm
													title="Remove this instance?"
													description="This instance will no longer be used for making translation requests"
													danger
													confirmLabel="Remove"
													onConfirm={() => {
														const index = translationPrefs.instances.indexOf(href);
														if (index !== -1) {
															translationPrefs.instances.splice(index, 1);
														}
													}}
												/>
											));
										}}
										variant="danger"
										class="-my-1.5 -mr-2.5"
									/>
								</div>
							)}
						</For>

						<Boxed.ButtonItem
							label="Add new instance"
							icon={AddOutlinedIcon}
							onClick={() => {
								openModal(() => <AddBasaInstancePrompt />);
							}}
						/>
					</Boxed.List>
				</Boxed.Group>

				<Boxed.Group>
					<Boxed.GroupHeader>Translation options</Boxed.GroupHeader>

					<Boxed.List>
						<Boxed.SelectItem
							label="Translate into"
							value={translationPrefs.to}
							onChange={(next) => (translationPrefs.to = next)}
							options={languageOptions}
						/>

						<Boxed.LinkItem
							to="/settings/content/translation/exclusion"
							label="Exclude languages from translation"
							description={`${translationPrefs.exclusions.length} languages excluded`}
						/>
					</Boxed.List>
				</Boxed.Group>
			</Boxed.Container>
		</>
	);
};

export default TranslationSettingsPage;
