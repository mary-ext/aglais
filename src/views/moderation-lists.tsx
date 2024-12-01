import { createMyListsQuery } from '~/api/queries/my-lists';

import IconButton from '~/components/icon-button';
import AddOutlinedIcon from '~/components/icons-central/add-outline';
import List from '~/components/list';
import ListItem from '~/components/lists/list-item';
import * as Page from '~/components/page';

const ModerationListsPage = () => {
	const lists = createMyListsQuery('moderation');

	return (
		<>
			<Page.Header>
				<Page.HeaderAccessory>
					<Page.Back to="/" />
				</Page.HeaderAccessory>

				<Page.Heading title="Moderation Lists" />

				<Page.HeaderAccessory>
					<IconButton
						icon={AddOutlinedIcon}
						title="Create new moderation list"
						onClick={() => {
							//
						}}
					/>
				</Page.HeaderAccessory>
			</Page.Header>

			<List
				data={lists.data}
				error={lists.error}
				render={(item) => {
					return <ListItem item={item} />;
				}}
				isFetchingNextPage={lists.isFetching}
			/>
		</>
	);
};

export default ModerationListsPage;
