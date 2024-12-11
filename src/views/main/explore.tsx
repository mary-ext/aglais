import { history } from '~/globals/navigation';

import { useTitle } from '~/lib/navigation/router';

import MyFeedsSection from '~/components/explore/my-feeds-section';
import IconButton from '~/components/icon-button';
import GearOutlinedIcon from '~/components/icons-central/gear-outline';
import SearchBar from '~/components/main/search-bar';
import * as Page from '~/components/page';

const ExplorePage = () => {
	useTitle(() => `Explore — ${import.meta.env.VITE_APP_NAME}`);

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

			<MyFeedsSection />

			<div class="mt-4"></div>
		</>
	);
};

export default ExplorePage;
