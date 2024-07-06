import { For } from 'solid-js';

import { createQuery } from '@mary/solid-query';

import { formatCompact } from '~/lib/intl/number';
import { useBookmarks } from '~/lib/states/bookmarks';

import BookmarkFolderAvatar from '~/components/bookmarks/bookmark-folder-avatar';
import IconButton from '~/components/icon-button';
import ChevronRightOutlinedIcon from '~/components/icons-central/chevron-right-outline';
import FolderAddOutlinedIcon from '~/components/icons-central/folder-add-outline';
import * as Page from '~/components/page';

interface TagEntry {
	id: number | string;
	name: string;
	color?: string;
	icon?: string;
	count: number;
}

const BookmarksPage = () => {
	const bookmarks = useBookmarks();

	const entries = createQuery(() => {
		return {
			queryKey: ['bookmarks'],
			staleTime: 30_000,
			async queryFn(): Promise<TagEntry[]> {
				const db = await bookmarks.open();
				const tx = db.transaction(['tags', 'bookmarks'], 'readonly');

				const tags = await tx.objectStore('tags').getAll();
				const bookmarksStore = tx.objectStore('bookmarks');

				const counts = await Promise.all([
					bookmarksStore.count(),
					...tags.map((tag) => {
						return bookmarksStore.index('tags').count(tag.id);
					}),
				]);

				return [
					{
						id: 'all',
						name: 'All bookmarks',
						count: counts[0],
					},
					...tags.map((tag, idx): TagEntry => {
						return {
							id: tag.id,
							name: tag.name,
							color: tag.color,
							icon: tag.icon,
							count: counts[idx + 1],
						};
					}),
				];
			},
		};
	});

	return (
		<>
			<Page.Header>
				<Page.HeaderAccessory>
					<Page.Back to="/" />
				</Page.HeaderAccessory>

				<Page.Heading title="Bookmarks" />

				<Page.HeaderAccessory>
					<IconButton icon={FolderAddOutlinedIcon} title="Create folder" />
				</Page.HeaderAccessory>
			</Page.Header>

			<For each={entries.data}>
				{(entry) => {
					return (
						<a
							href={/* @once */ `/bookmarks/${entry.id}`}
							class="flex items-center gap-4 px-4 py-3 hover:bg-contrast/sm active:bg-contrast/sm-pressed"
						>
							<BookmarkFolderAvatar color={/* @once */ entry.color} icon={/* @once */ entry.icon} />

							<span class="min-w-0 grow overflow-hidden text-ellipsis whitespace-nowrap break-words text-sm font-bold">
								{/* @once */ entry.name}
							</span>

							<div class="flex shrink-0 items-center gap-3">
								<span class="text-sm text-contrast-muted">{/* @once */ formatCompact(entry.count)}</span>
								<ChevronRightOutlinedIcon class="shrink-0 text-xl text-contrast-muted" />
							</div>
						</a>
					);
				}}
			</For>
		</>
	);
};

export default BookmarksPage;
