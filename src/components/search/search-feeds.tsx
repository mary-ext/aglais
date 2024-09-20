import { createSearchFeedsQuery } from '~/api/queries/search-feeds';

import FeedItem from '~/components/feeds/feed-item';
import PagedList from '~/components/paged-list';
import VirtualItem from '~/components/virtual-item';

export interface SearchFeedsProps {
	q: string;
}

const SearchFeeds = (props: SearchFeedsProps) => {
	const feeds = createSearchFeedsQuery(() => props.q);

	return (
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
	);
};

export default SearchFeeds;
