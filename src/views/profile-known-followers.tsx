import { createMemo } from 'solid-js';

import { createProfileKnownFollowersQuery } from '~/api/queries/profile-known-followers';

import { useParams } from '~/lib/navigation/router';

import * as Page from '~/components/page';
import PagedList from '~/components/paged-list';
import ProfileFollowButton from '~/components/profiles/profile-follow-button';
import ProfileItem from '~/components/profiles/profile-item';
import VirtualItem from '~/components/virtual-item';

const ProfileKnownFollowersPage = () => {
	const { did } = useParams();

	const followers = createProfileKnownFollowersQuery(() => did);
	const subject = createMemo(() => followers.data?.pages[0].subject);

	return (
		<>
			<Page.Header>
				<Page.HeaderAccessory>
					<Page.Back to={`/${did}`} />
				</Page.HeaderAccessory>

				<Page.Heading
					title="Followers you know"
					subtitle={(() => {
						const $subject = subject();
						if ($subject) {
							return '@' + $subject.handle;
						}
					})()}
				/>
			</Page.Header>

			<PagedList
				data={followers.data?.pages.map((page) => page.profiles)}
				error={followers.error}
				render={(item) => {
					return (
						<VirtualItem estimateHeight={88}>
							<ProfileItem item={item} AsideComponent={<ProfileFollowButton profile={item} />} />
						</VirtualItem>
					);
				}}
				hasNextPage={followers.hasNextPage}
				isFetchingNextPage={followers.isFetching}
				onEndReached={() => followers.fetchNextPage()}
			/>
		</>
	);
};

export default ProfileKnownFollowersPage;
