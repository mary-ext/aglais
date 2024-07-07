import { createBookmarkFeedQuery, createBookmarkFolderMetaQuery } from '~/api/queries/bookmark-feed';

import { useParams } from '~/lib/navigation/router';

import * as Page from '~/components/page';
import PagedList from '~/components/paged-list';
import VirtualItem from '~/components/virtual-item';

import BookmarkFeedItem from '~/components/bookmarks/bookmark-feed-item';

const BookmarksPage = () => {
	const { tagId } = useParams();

	const meta = tagId !== 'all' ? createBookmarkFolderMetaQuery(() => tagId) : undefined;
	const listing = createBookmarkFeedQuery(() => tagId);

	return (
		<>
			<Page.Header>
				<Page.HeaderAccessory>
					<Page.Back to="/bookmarks" />
				</Page.HeaderAccessory>

				<Page.Heading title={meta ? meta.data?.name : `All Bookmarks`} />
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
