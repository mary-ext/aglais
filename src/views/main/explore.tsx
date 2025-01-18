import { createEffect, createSignal, onCleanup } from 'solid-js';

import { Freeze } from '@mary/solid-freeze';

import { hasModals } from '~/globals/modals';
import { history } from '~/globals/navigation';

import { useModalClose } from '~/lib/hooks/modal-close';
import { createFocusEffect, useTitle } from '~/lib/navigation/router';

import MyFeedsSection from '~/components/explore/my-feeds-section';
import IconButton from '~/components/icon-button';
import ArrowLeftOutlinedIcon from '~/components/icons-central/arrow-left-outline';
import GearOutlinedIcon from '~/components/icons-central/gear-outline';
import SearchBar from '~/components/main/search-bar';
import * as Page from '~/components/page';
import SearchSuggestionsView from '~/components/search/search-suggestions-view';

const ExplorePage = () => {
	const [query, setQuery] = createSignal('');
	const [isInputFocused, setIsInputFocused] = createSignal(false);

	const onSearch = (term: string) => {
		history.navigate(`/search?q=${encodeURIComponent(term)}`);
	};

	useTitle(() => `Explore — ${import.meta.env.VITE_APP_NAME}`);

	createFocusEffect(() => {
		createEffect(() => {
			if (isInputFocused()) {
				window.scrollTo({ top: 0, behavior: 'instant' });

				useModalClose(
					null,
					() => setIsInputFocused(false),
					() => !hasModals(),
				);
			}
		});

		onCleanup(() => {
			setQuery('');
			setIsInputFocused(false);
		});
	});

	return (
		<>
			<Page.Header>
				<Page.HeaderAccessory>
					{!isInputFocused() ? (
						<Page.MainMenu />
					) : (
						<IconButton
							title="Close search"
							icon={ArrowLeftOutlinedIcon}
							onClick={() => setIsInputFocused(false)}
						/>
					)}
				</Page.HeaderAccessory>

				<SearchBar
					value={query()}
					onChange={(next) => {
						setQuery(next);
						setIsInputFocused(true);
					}}
					onClick={() => setIsInputFocused(true)}
					onSubmit={() => {
						const $query = query();
						if ($query.trim() === '') {
							return;
						}

						onSearch($query);
					}}
				/>

				{!isInputFocused() && (
					<Page.HeaderAccessory>
						<IconButton icon={GearOutlinedIcon} title="Settings" />
					</Page.HeaderAccessory>
				)}
			</Page.Header>

			<Freeze freeze={!isInputFocused()}>
				<SearchSuggestionsView query={query()} onSearch={onSearch} />
			</Freeze>

			<Freeze freeze={isInputFocused()}>
				<MyFeedsSection />
				<div class="mt-4"></div>
			</Freeze>
		</>
	);
};

export default ExplorePage;
