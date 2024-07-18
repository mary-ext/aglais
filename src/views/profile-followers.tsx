import { createMemo } from 'solid-js';

import { createProfileFollowersQuery } from '~/api/queries/profile-followers';

import { useParams } from '~/lib/navigation/router';

import * as Page from '~/components/page';
import PagedList from '~/components/paged-list';
import VirtualItem from '~/components/virtual-item';

import ProfileFollowButton from '~/components/profiles/profile-follow-button';
import ProfileItem from '~/components/profiles/profile-item';

const ProfileFollowersPage = () => {
	const { didOrHandle } = useParams();

	const followers = createProfileFollowersQuery(() => didOrHandle);
	const subject = createMemo(() => followers.data?.pages[0].subject);

	return (
		<>
			<Page.Header>
				<Page.HeaderAccessory>
					<Page.Back to={`/${didOrHandle}`} />
				</Page.HeaderAccessory>

				<Page.Heading
					title="Followers"
					subtitle={(() => {
						const $subject = subject();
						if ($subject) {
							return '@' + $subject.handle;
						}
					})()}
				/>
			</Page.Header>

			<PagedList
				data={followers.data?.pages.map((page) => page.followers)}
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

export default ProfileFollowersPage;
