import { createMemo } from 'solid-js';

import { createProfileFollowingQuery } from '~/api/queries/profile-following';

import { useParams, useTitle } from '~/lib/navigation/router';

import * as Page from '~/components/page';
import PagedList from '~/components/paged-list';
import ProfileFollowButton from '~/components/profiles/profile-follow-button';
import ProfileItem from '~/components/profiles/profile-item';
import VirtualItem from '~/components/virtual-item';

const ProfileFollowingPage = () => {
	const { did } = useParams();

	const following = createProfileFollowingQuery(() => did);
	const subject = createMemo(() => following.data?.pages[0].subject);

	useTitle(() => {
		const data = subject();
		if (data) {
			const handle = data.handle.toLowerCase();

			return `Users followed by @${handle} — ${import.meta.env.VITE_APP_NAME}`;
		}

		return `Users followed by — ${import.meta.env.VITE_APP_NAME}`;
	});

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
							return '@' + $subject.handle.toLowerCase();
						}
					})()}
				/>
			</Page.Header>

			<PagedList
				data={following.data?.pages.map((page) => page.profiles)}
				error={following.error}
				render={(item) => {
					return (
						<VirtualItem estimateHeight={64}>
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
