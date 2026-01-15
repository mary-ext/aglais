import type { AppBskyBookmarkDefs, AppBskyFeedDefs } from '@atcute/bluesky';

import { createBookmarksQuery } from '~/api/queries/bookmark';

import { useTitle } from '~/lib/navigation/router';

import BookmarkFeedItem from '~/components/bookmarks/bookmark-feed-item';
import * as Page from '~/components/page';
import PagedList from '~/components/paged-list';
import VirtualItem from '~/components/virtual-item';

type PostBookmarkView = AppBskyBookmarkDefs.BookmarkView & { item: AppBskyFeedDefs.PostView };

const BookmarksPage = () => {
	const query = createBookmarksQuery();

	useTitle(() => `Bookmarks — ${import.meta.env.VITE_APP_NAME}`);

	return (
		<>
			<Page.Header>
				<Page.HeaderAccessory>
					<Page.Back to="/" />
				</Page.HeaderAccessory>

				<Page.Heading title="Bookmarks" />
			</Page.Header>

			<PagedList
				data={query.data?.pages.map((page) => page.bookmarks)}
				error={query.error}
				render={(item) => {
					// skip blocked or not found posts
					if (item.item.$type !== 'app.bsky.feed.defs#postView') {
						return null;
					}

					return (
						<VirtualItem estimateHeight={99}>
							<BookmarkFeedItem item={item as PostBookmarkView} />
						</VirtualItem>
					);
				}}
				hasNextPage={query.hasNextPage}
				isFetchingNextPage={query.isFetchingNextPage || query.isLoading}
				onEndReached={() => query.fetchNextPage()}
			/>
		</>
	);
};

export default BookmarksPage;
