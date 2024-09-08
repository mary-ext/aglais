import { createSignal } from 'solid-js';

import { createBookmarkFeedQuery, createBookmarkFolderMetaQuery } from '~/api/queries/bookmark-feed';

import { useParams } from '~/lib/navigation/router';

import BookmarkFeedItem from '~/components/bookmarks/bookmark-feed-item';
import MagnifyingGlassOutlinedIcon from '~/components/icons-central/magnifying-glass-outline';
import * as Page from '~/components/page';
import PagedList from '~/components/paged-list';
import VirtualItem from '~/components/virtual-item';

const BookmarksPage = () => {
	const { tagId } = useParams();

	const [search, setSearch] = createSignal('');

	const meta = tagId !== 'all' ? createBookmarkFolderMetaQuery(() => tagId) : undefined;
	const listing = createBookmarkFeedQuery(() => tagId, search);

	return (
		<>
			<Page.Header>
				<Page.HeaderAccessory>
					<Page.Back to="/bookmarks" />
				</Page.HeaderAccessory>

				<Page.Heading title={meta ? meta.data?.name : `All Bookmarks`} />
			</Page.Header>

			<form
				onSubmit={(ev) => {
					ev.preventDefault();

					const input = ev.currentTarget.elements.namedItem('search') as HTMLInputElement;
					setSearch(input.value);
				}}
				class="px-4 pb-1 pt-0"
			>
				<div class="relative h-max grow">
					<div class="pointer-events-none absolute inset-y-0 ml-px grid w-10 place-items-center">
						<MagnifyingGlassOutlinedIcon class="text-lg text-contrast-muted" />
					</div>

					<input
						type="search"
						name="search"
						value={search()}
						placeholder="Search"
						class="h-10 w-full rounded-full border border-outline-md bg-background px-3 pl-10 text-sm text-contrast outline-2 -outline-offset-2 outline-accent placeholder:text-contrast-muted focus:outline"
					/>
				</div>
			</form>

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
