import { createBookmarkFeedQuery } from '~/api/queries/bookmark-feed';

import * as Page from '~/components/page';
import PagedList from '~/components/paged-list';
import VirtualItem from '~/components/virtual-item';

import BookmarkFeedItem from '~/components/bookmarks/bookmark-feed-item';

const BookmarksPage = () => {
	const listing = createBookmarkFeedQuery(() => undefined);

	return (
		<>
			<Page.Header>
				<Page.HeaderAccessory>
					<Page.Back to="/bookmarks" />
				</Page.HeaderAccessory>

				<Page.Heading title="All bookmarks" />
			</Page.Header>

			<PagedList
				data={listing.data?.pages.map((page) => page.items)}
				error={listing.error}
				render={(item) => {
					return (
						<VirtualItem estimateHeight={99}>
							<BookmarkFeedItem item={item} />
						</VirtualItem>
					);
				}}
				hasNextPage={listing.hasNextPage}
				isFetchingNextPage={listing.isFetchingNextPage || listing.isLoading}
				onEndReached={() => listing.fetchNextPage()}
			/>
		</>
	);
};

export default BookmarksPage;
