import { batch } from 'solid-js';

import { dequal } from '~/api/utils/dequal';

import { openModal } from '~/globals/modals';

import { LANGUAGE_CODES, getEnglishLanguageName } from '~/lib/intl/languages';
import { useTitle } from '~/lib/navigation/router';
import {
	fromPersistedPostgate,
	fromPersistedThreadgate,
	toPersistedPostgate,
	toPersistedThreadgate,
} from '~/lib/preferences/snippets/composer';
import { useSession } from '~/lib/states/session';
import { mapDefined } from '~/lib/utils/misc';

import * as Boxed from '~/components/boxed';
import ComposedInteractionDialogLazy from '~/components/composer/dialogs/composed-interaction-dialog-lazy';
import TranslateOutlinedIcon from '~/components/icons-central/translate-outline';
import * as Page from '~/components/page';

const ContentSettingsPage = () => {
	useTitle(() => `Content settings — ${import.meta.env.VITE_APP_NAME}`);

	return (
		<>
			<Page.Header>
				<Page.HeaderAccessory>
					<Page.Back to="/settings" />
				</Page.HeaderAccessory>

				<Page.Heading title="Content" />
			</Page.Header>

			<Boxed.Container>
				<Boxed.Group>
					<Boxed.List>
						<Boxed.LinkItem
							to="/settings/content/translation"
							label="Content translation"
							icon={TranslateOutlinedIcon}
						/>
					</Boxed.List>
				</Boxed.Group>

				<ComposerSettingsGroup />
			</Boxed.Container>
		</>
	);
};

export default ContentSettingsPage;

const ComposerSettingsGroup = () => {
	const { currentAccount } = useSession();

	const preferences = currentAccount!.preferences;
	const composerPrefs = preferences.composer;

	const languageOptions = getLanguageOptions();

	return (
		<Boxed.Group>
			<Boxed.GroupHeader>Content you post</Boxed.GroupHeader>

			<Boxed.List>
				<Boxed.SelectItem
					label="Post language"
					value={composerPrefs.language}
					onChange={(next) => (composerPrefs.language = next)}
					options={languageOptions}
				/>

				<Boxed.ButtonItem
					label="Who can interact with my posts"
					description={(() => {
						const threadAllow = composerPrefs.threadgate.allow;
						const embedRules = composerPrefs.postgate.embeddingRules;

						if (threadAllow === undefined && embedRules === undefined) {
							return `Everyone`;
						}

						return `Limited`;
					})()}
					onClick={() => {
						openModal(() => (
							<ComposedInteractionDialogLazy
								initialState={{
									postgate: fromPersistedPostgate(composerPrefs.postgate),
									threadgate: fromPersistedThreadgate(composerPrefs.threadgate),
								}}
								onApply={({ postgate, threadgate }) => {
									batch(() => {
										const persistedPostgate = toPersistedPostgate(postgate);
										const persistedThreadgate = toPersistedThreadgate(threadgate);

										if (!dequal(composerPrefs.postgate, persistedPostgate)) {
											composerPrefs.postgate = persistedPostgate;
										}

										if (!dequal(composerPrefs.threadgate, persistedThreadgate)) {
											composerPrefs.threadgate = persistedThreadgate;
										}
									});
								}}
							/>
						));
					}}
				/>
			</Boxed.List>

			<Boxed.GroupBlurb>Altering these settings will not affect existing posts</Boxed.GroupBlurb>
		</Boxed.Group>
	);
};

const getLanguageOptions = (): Boxed.SelectItemOption<string>[] => {
	return [
		{
			value: 'system',
			label: `System default`,
		},
		...mapDefined(LANGUAGE_CODES, (code): Boxed.SelectItemOption<string> | undefined => {
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
};
