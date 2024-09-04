import { primarySystemLanguage } from '~/globals/locales';

import { getEnglishLanguageName, LANGUAGE_CODES } from '~/lib/intl/languages';
import { useSession } from '~/lib/states/session';
import { mapDefined } from '~/lib/utils/misc';

import * as Boxed from '~/components/boxed';
import * as Page from '~/components/page';

const ContentSettingsPage = () => {
	const { currentAccount } = useSession();

	const preferences = currentAccount!.preferences;
	const composerPrefs = preferences.composer;
	const translationPrefs = preferences.translation;

	const languageOptions = getLanguageOptions();

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

				<Boxed.Group>
					<Boxed.GroupHeader>Content translations</Boxed.GroupHeader>

					<Boxed.List>
						<Boxed.ToggleItem
							label="Use Google Translate"
							enabled={translationPrefs.enabled}
							onChange={(next) => (translationPrefs.enabled = next)}
						/>

						{translationPrefs.enabled && (
							<>
								<Boxed.SelectItem
									label="Translate into"
									value={translationPrefs.to}
									onChange={(next) => (translationPrefs.to = next)}
									options={languageOptions}
								/>

								<Boxed.ButtonItem
									label="Exclude languages from translation"
									description={`${translationPrefs.exclusions.length} languages excluded`}
									onClick={() => {
										//
									}}
								/>
							</>
						)}
					</Boxed.List>

					{translationPrefs.enabled && (
						<Boxed.List>
							<Boxed.ToggleItem
								label="Proxy translation requests"
								description="Send translations through a proxy service rather than directly. Availability might be limited"
								enabled={translationPrefs.proxy}
								onChange={(next) => (translationPrefs.proxy = next)}
							/>
						</Boxed.List>
					)}
				</Boxed.Group>
			</Boxed.Container>
		</>
	);
};

export default ContentSettingsPage;

const getLanguageOptions = (): Boxed.SelectItemOption<string>[] => {
	const systemLanguage = getEnglishLanguageName(primarySystemLanguage);

	return [
		{
			value: 'system',
			label: `System default (${systemLanguage})`,
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
