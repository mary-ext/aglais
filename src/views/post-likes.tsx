import { createSubjectLikersQuery } from '~/api/queries/subject-likers';
import { makeAtUri } from '~/api/utils/strings';

import { useParams } from '~/lib/navigation/router';

import * as Page from '~/components/page';
import PagedList from '~/components/paged-list';
import ProfileFollowButton from '~/components/profiles/profile-follow-button';
import ProfileItem from '~/components/profiles/profile-item';
import VirtualItem from '~/components/virtual-item';

const PostLikesPage = () => {
	const { did, rkey } = useParams();

	const uri = makeAtUri(did, 'app.bsky.feed.post', rkey);
	const likers = createSubjectLikersQuery(() => uri);

	return (
		<>
			<Page.Header>
				<Page.HeaderAccessory>
					<Page.Back to={`/${did}/${rkey}`} />
				</Page.HeaderAccessory>

				<Page.Heading title="Liked by" />
			</Page.Header>

			<PagedList
				data={likers.data?.pages.map((page) => page.profiles)}
				error={likers.error}
				render={(item) => {
					return (
						<VirtualItem estimateHeight={64}>
							<ProfileItem item={item} AsideComponent={<ProfileFollowButton profile={item} />} />
						</VirtualItem>
					);
				}}
				hasNextPage={likers.hasNextPage}
				isFetchingNextPage={likers.isFetching}
				onEndReached={() => likers.fetchNextPage()}
			/>
		</>
	);
};

export default PostLikesPage;
