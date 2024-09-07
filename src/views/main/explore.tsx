import { createSignal } from 'solid-js';

import IconButton from '~/components/icon-button';
import GearOutlinedIcon from '~/components/icons-central/gear-outline';
import SearchBar from '~/components/main/search-bar';
import * as Page from '~/components/page';

const SearchPage = () => {
	const [search, setSearch] = createSignal('');
	const [focused, setFocused] = createSignal(false);

	return (
		<>
			<Page.Header>
				<Page.HeaderAccessory>
					<Page.MainMenu />
				</Page.HeaderAccessory>

				<SearchBar />

				<Page.HeaderAccessory>
					<IconButton icon={GearOutlinedIcon} title="Settings" />
				</Page.HeaderAccessory>
			</Page.Header>
		</>
	);
};

export default SearchPage;
