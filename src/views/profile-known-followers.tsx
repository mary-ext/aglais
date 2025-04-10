import { createMemo } from 'solid-js';

import type { At } from '@atcute/client/lexicons';

import { createProfileKnownFollowersQuery } from '~/api/queries/profile-known-followers';

import { useParams, useTitle } from '~/lib/navigation/router';

import * as Page from '~/components/page';
import PagedList from '~/components/paged-list';
import ProfileFollowButton from '~/components/profiles/profile-follow-button';
import ProfileItem from '~/components/profiles/profile-item';
import VirtualItem from '~/components/virtual-item';

const ProfileKnownFollowersPage = () => {
	const { did } = useParams<{
		did: At.Did;
	}>();

	const followers = createProfileKnownFollowersQuery(() => did);
	const subject = createMemo(() => followers.data?.pages[0].subject);

	useTitle(() => {
		const data = subject();
		if (data) {
			const handle = data.handle.toLowerCase();

			return `Followers of @${handle} that you know — ${import.meta.env.VITE_APP_NAME}`;
		}

		return `Followers that you know — ${import.meta.env.VITE_APP_NAME}`;
	});

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
							return '@' + $subject.handle.toLowerCase();
						}
					})()}
				/>
			</Page.Header>

			<PagedList
				data={followers.data?.pages.map((page) => page.profiles)}
				error={followers.error}
				render={(item) => {
					return (
						<VirtualItem estimateHeight={64}>
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
