import { LANGUAGE_CODES, getEnglishLanguageName } from '~/lib/intl/languages';
import { useSession } from '~/lib/states/session';
import { mapDefined } from '~/lib/utils/misc';

import * as Boxed from '~/components/boxed';
import TranslateOutlinedIcon from '~/components/icons-central/translate-outline';
import * as Page from '~/components/page';

const ContentSettingsPage = () => {
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
					value={composerPrefs.defaultPostLanguage}
					onChange={(next) => (composerPrefs.defaultPostLanguage = next)}
					options={languageOptions}
				/>

				<Boxed.SelectItem
					label="Who can reply to my posts"
					value={composerPrefs.defaultReplyGate}
					onChange={(next) => (composerPrefs.defaultReplyGate = next)}
					options={[
						{ value: 'everyone', label: `Everyone` },
						{ value: 'follows', label: `Followed users` },
						{ value: 'mentions', label: `Mentioned users` },
					]}
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
