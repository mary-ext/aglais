import { For, createMemo, createSignal, untrack } from 'solid-js';

import { dequal } from '~/api/utils/dequal';

import { useModalContext } from '~/globals/modals';

import { LANGUAGE_CODES, getEnglishLanguageName, getNativeLanguageName } from '~/lib/intl/languages';
import { mapDefined } from '~/lib/misc';

import Button from '../../button';
import * as Dialog from '../../dialog';
import EndOfListView from '../../end-of-list-view';
import CheckOutlinedIcon from '../../icons-central/check-outline';
import SearchInput from '../../search-input';

export interface LanguageSelectDialogProps {
	languages: string[];
	onChange: (next: string[]) => void;
}

const LanguageSelectDialog = (props: LanguageSelectDialogProps) => {
	const { close } = useModalContext();

	const originalLanguages = props.languages;
	const [languages, setLanguages] = createSignal(originalLanguages);
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
		const $languages = untrack(languages);

		let filtered: typeof availableLanguages;
		if ($search === '') {
			filtered = availableLanguages.slice();
		} else {
			filtered = availableLanguages.filter((entry) => entry.query.includes($search));
		}

		const boundary = filtered.length;

		filtered.sort((a, b) => {
			const aidx = $languages.indexOf(a.code);
			const bidx = $languages.indexOf(b.code);

			return (aidx !== -1 ? aidx : boundary) - (bidx !== -1 ? bidx : boundary);
		});

		return filtered;
	});

	const isEqual = () => dequal(originalLanguages, languages());

	return (
		<>
			<Dialog.Backdrop />
			<Dialog.Container maxWidth="sm" fullHeight>
				<Dialog.Header>
					<Dialog.HeaderAccessory>
						<Dialog.Close />
					</Dialog.HeaderAccessory>

					<Dialog.Heading title="Post languages" />

					<Dialog.HeaderAccessory>
						<Button
							disabled={isEqual()}
							onClick={() => {
								close();
								props.onChange(languages());
							}}
							variant="primary"
							size="sm"
						>
							Save
						</Button>
					</Dialog.HeaderAccessory>
				</Dialog.Header>

				<Dialog.Body unpadded>
					<div class="p-4">
						<SearchInput value={search()} onChange={setSearch} autofocus placeholder="Search languages" />
					</div>

					<div class="flex flex-col">
						<For each={filteredLanguages()}>
							{({ code, english, native }) => {
								const index = createMemo(() => languages().indexOf(code));

								return (
									<button
										onClick={() => {
											const $index = index();

											if ($index === -1) {
												setLanguages((langs) => langs.concat(code));
											} else {
												setLanguages((langs) => langs.toSpliced($index, 1));
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
					</div>

					<EndOfListView />
				</Dialog.Body>
			</Dialog.Container>
		</>
	);
};

export default LanguageSelectDialog;
