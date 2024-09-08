import IconButton from '~/components/icon-button';
import GearOutlinedIcon from '~/components/icons-central/gear-outline';
import SearchBar from '~/components/main/search-bar';
import * as Page from '~/components/page';
import { history } from '~/globals/navigation';

const SearchPage = () => {
	return (
		<>
			<Page.Header>
				<Page.HeaderAccessory>
					<Page.MainMenu />
				</Page.HeaderAccessory>

				<SearchBar
					onEnter={(next, reset) => {
						if (next.trim() === '') {
							return;
						}

						history.navigate(`/search?q=${encodeURIComponent(next)}`);
						reset();
					}}
				/>

				<Page.HeaderAccessory>
					<IconButton icon={GearOutlinedIcon} title="Settings" />
				</Page.HeaderAccessory>
			</Page.Header>
		</>
	);
};

export default SearchPage;
