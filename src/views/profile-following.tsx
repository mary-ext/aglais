import { createMemo } from 'solid-js';

import { createProfileFollowingQuery } from '~/api/queries/profile-following';

import { useParams } from '~/lib/navigation/router';

import * as Page from '~/components/page';
import PagedList from '~/components/paged-list';
import VirtualItem from '~/components/virtual-item';

import ProfileFollowButton from '~/components/profiles/profile-follow-button';
import ProfileItem from '~/components/profiles/profile-item';

const ProfileFollowingPage = () => {
	const { did } = useParams();

	const following = createProfileFollowingQuery(() => did);
	const subject = createMemo(() => following.data?.pages[0].subject);

	return (
		<>
			<Page.Header>
				<Page.HeaderAccessory>
					<Page.Back to={`/${did}`} />
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
					return (
						<VirtualItem estimateHeight={88}>
							<ProfileItem item={item} AsideComponent={<ProfileFollowButton profile={item} />} />
						</VirtualItem>
					);
				}}
				hasNextPage={following.hasNextPage}
				isFetchingNextPage={following.isFetching}
				onEndReached={() => following.fetchNextPage()}
			/>
		</>
	);
};

export default ProfileFollowingPage;
