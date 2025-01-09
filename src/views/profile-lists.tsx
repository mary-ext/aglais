import { createProfileQuery } from '~/api/queries/profile';
import { createProfileListsQuery } from '~/api/queries/profile-lists';

import { useParams, useTitle } from '~/lib/navigation/router';

import ListItem from '~/components/lists/list-item';
import * as Page from '~/components/page';
import PagedList from '~/components/paged-list';

const ProfileListsPage = () => {
	const { did } = useParams();

	const lists = createProfileListsQuery(() => did);
	const profile = createProfileQuery(() => did);

	useTitle(() => {
		const data = profile.data;
		if (data) {
			const handle = data.handle.toLowerCase();

			return `Lists by @${handle} — ${import.meta.env.VITE_APP_NAME}`;
		}

		return `Lists by user — ${import.meta.env.VITE_APP_NAME}`;
	});

	return (
		<>
			<Page.Header>
				<Page.HeaderAccessory>
					<Page.Back to={`/${did}`} />
				</Page.HeaderAccessory>

				<Page.Heading
					title="Lists"
					subtitle={(() => {
						const subject = profile.data;
						if (subject) {
							return '@' + subject.handle.toLowerCase();
						}
					})()}
				/>
			</Page.Header>

			<PagedList
				data={lists.data?.pages.map((page) => page.lists)}
				error={lists.error}
				render={(item) => {
					return <ListItem item={item} />;
				}}
				hasNextPage={lists.hasNextPage}
				isFetchingNextPage={lists.isFetching}
				onEndReached={() => lists.fetchNextPage()}
			/>
		</>
	);
};

export default ProfileListsPage;
