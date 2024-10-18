import { For, Show, createMemo, createSignal, untrack } from 'solid-js';

import { LANGUAGE_CODES, getEnglishLanguageName, getNativeLanguageName } from '~/lib/intl/languages';
import { useSession } from '~/lib/states/session';
import { mapDefined } from '~/lib/utils/misc';

import * as Boxed from '~/components/boxed';
import EndOfListView from '~/components/end-of-list-view';
import CheckOutlinedIcon from '~/components/icons-central/check-outline';
import * as Page from '~/components/page';
import SearchInput from '~/components/search-input';

const ContentTranslationExclusionSettingsPage = () => {
	const { currentAccount } = useSession();

	const preferences = currentAccount!.preferences;
	const translationPrefs = preferences.translation;

	const [search, setSearch] = createSignal('');

	const availableLanguages = mapDefined(LANGUAGE_CODES, (code) => {
		const englishName = getEnglishLanguageName(code);
		const nativeName = getNativeLanguageName(code);

		if (!englishName || !nativeName) {
			return;
		}

		return {
			query: `${code}${englishName}${nativeName}`.toLowerCase(),
			code: code,
			english: englishName,
			native: nativeName,
		};
	});

	const normalizedSearch = createMemo(() => search().trim().toLowerCase());
	const filteredLanguages = createMemo(() => {
		const $search = normalizedSearch();

		let filtered: typeof availableLanguages;
		if ($search === '') {
			filtered = availableLanguages.slice();
		} else {
			filtered = availableLanguages.filter((entry) => entry.query.includes($search));
		}

		const boundary = filtered.length;

		untrack(() => {
			const $languages = translationPrefs.exclusions;

			filtered.sort((a, b) => {
				const aidx = $languages.indexOf(a.code);
				const bidx = $languages.indexOf(b.code);

				return (aidx !== -1 ? aidx : boundary) - (bidx !== -1 ? bidx : boundary);
			});
		});

		return filtered;
	});

	return (
		<>
			<Page.Header>
				<Page.HeaderAccessory>
					<Page.Back to="/settings/content/translation" />
				</Page.HeaderAccessory>

				<Page.Heading title="Exclude languages from translation" />
			</Page.Header>

			<Boxed.Container>
				<Boxed.Group>
					<div class="mx-4 mb-2">
						<SearchInput value={search()} onChange={setSearch} />
					</div>

					<Show when={filteredLanguages().length === 0}>
						<EndOfListView />
					</Show>

					<Boxed.List>
						<For each={filteredLanguages()}>
							{({ code, english, native }) => {
								const index = createMemo(() => translationPrefs.exclusions.indexOf(code));

								return (
									<button
										onClick={() => {
											const $index = index();

											if ($index === -1) {
												translationPrefs.exclusions.push(code);
											} else {
												translationPrefs.exclusions.splice($index, 1);
											}
										}}
										class="flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-contrast/sm active:bg-contrast/sm-pressed"
									>
										<div class="text-sm">
											<p>{english}</p>
											<p class="text-contrast-muted">{native}</p>
										</div>

										{index() !== -1 && <CheckOutlinedIcon class="text-2xl text-accent" />}
									</button>
								);
							}}
						</For>
					</Boxed.List>
				</Boxed.Group>
			</Boxed.Container>
		</>
	);
};

export default ContentTranslationExclusionSettingsPage;
