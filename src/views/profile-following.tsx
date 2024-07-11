import { createMemo } from 'solid-js';

import { createProfileFollowingQuery } from '~/api/queries/profile-following';

import { useParams } from '~/lib/navigation/router';

import * as Page from '~/components/page';
import PagedList from '~/components/paged-list';

const ProfileFollowingPage = () => {
	const { didOrHandle } = useParams();

	const following = createProfileFollowingQuery(() => didOrHandle);
	const subject = createMemo(() => following.data?.pages[0].subject);

	return (
		<>
			<Page.Header>
				<Page.HeaderAccessory>
					<Page.Back to={`/${didOrHandle}`} />
				</Page.HeaderAccessory>

				<Page.Heading
					title="Following"
					subtitle={(() => {
						const $subject = subject();
						if ($subject) {
							return '@' + $subject.handle;
						}
					})()}
				/>
			</Page.Header>

			<PagedList
				data={following.data?.pages.map((page) => page.follows)}
				error={following.error}
				render={(item) => {
					return <div>{item.handle}</div>;
				}}
				hasNextPage={following.hasNextPage}
				isFetchingNextPage={following.isFetching}
				onEndReached={() => following.fetchNextPage()}
			/>
		</>
	);
};

export default ProfileFollowingPage;
