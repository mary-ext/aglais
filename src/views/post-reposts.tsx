import { createSubjectRepostersQuery } from '~/api/queries/subject-reposters';

import { useParams } from '~/lib/navigation/router';

import * as Page from '~/components/page';
import PagedList from '~/components/paged-list';
import VirtualItem from '~/components/virtual-item';

import ProfileFollowButton from '~/components/profiles/profile-follow-button';
import ProfileItem from '~/components/profiles/profile-item';

const PostLikesPage = () => {
	const { did, rkey } = useParams();

	const reposters = createSubjectRepostersQuery(() => `at://${did}/app.bsky.feed.post/${rkey}`);

	return (
		<>
			<Page.Header>
				<Page.HeaderAccessory>
					<Page.Back to={`/${did}/${rkey}`} />
				</Page.HeaderAccessory>

				<Page.Heading title="Reposted by" />
			</Page.Header>

			<PagedList
				data={reposters.data?.pages.map((page) => page.repostedBy)}
				error={reposters.error}
				render={(item) => {
					return (
						<VirtualItem estimateHeight={88}>
							<ProfileItem item={item} AsideComponent={<ProfileFollowButton profile={item} />} />
						</VirtualItem>
					);
				}}
				hasNextPage={reposters.hasNextPage}
				isFetchingNextPage={reposters.isFetching}
				onEndReached={() => reposters.fetchNextPage()}
			/>
		</>
	);
};

export default PostLikesPage;
