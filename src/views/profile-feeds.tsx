import { createProfileQuery } from '~/api/queries/profile';
import { createProfileFeedsQuery } from '~/api/queries/profile-feeds';

import { useParams } from '~/lib/navigation/router';

import FeedItem from '~/components/feeds/feed-item';
import * as Page from '~/components/page';
import PagedList from '~/components/paged-list';
import VirtualItem from '~/components/virtual-item';

const ProfileFeedsPage = () => {
	const { did } = useParams();

	const feeds = createProfileFeedsQuery(() => did);
	const profile = createProfileQuery(() => did);

	return (
		<>
			<Page.Header>
				<Page.HeaderAccessory>
					<Page.Back to={`/${did}`} />
				</Page.HeaderAccessory>

				<Page.Heading
					title="Feeds"
					subtitle={(() => {
						const subject = profile.data;
						if (subject) {
							return '@' + subject.handle;
						}
					})()}
				/>
			</Page.Header>

			<PagedList
				data={feeds.data?.pages.map((page) => page.feeds)}
				error={feeds.error}
				render={(item) => {
					return (
						<VirtualItem estimateHeight={125}>
							<FeedItem item={item} />
						</VirtualItem>
					);
				}}
				hasNextPage={feeds.hasNextPage}
				isFetchingNextPage={feeds.isFetching}
				onEndReached={() => feeds.fetchNextPage()}
			/>
		</>
	);
};

export default ProfileFeedsPage;
