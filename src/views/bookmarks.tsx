import { For, Match, Switch } from 'solid-js';

import { createQuery } from '@mary/solid-query';

import { openModal } from '~/globals/modals';

import type { TagItem } from '~/lib/aglais-bookmarks/db';
import { formatCompact } from '~/lib/intl/number';
import { useBookmarks } from '~/lib/states/bookmarks';

import IconButton from '~/components/icon-button';
import ChevronRightOutlinedIcon from '~/components/icons-central/chevron-right-outline';
import FolderAddOutlinedIcon from '~/components/icons-central/folder-add-outline';
import * as Page from '~/components/page';

import BookmarkFolderAvatar from '~/components/bookmarks/bookmark-folder-avatar';
import BookmarkFolderFormDialogLazy from '~/components/bookmarks/bookmark-folder-form-dialog-lazy';

interface HydratedTagItem extends TagItem {
	count: number;
}

const BookmarksPage = () => {
	const bookmarks = useBookmarks();

	const query = createQuery(() => {
		return {
			queryKey: ['bookmarks'],
			staleTime: 30_000,
			async queryFn() {
				const db = await bookmarks.open();
				const tx = db.transaction(['tags', 'bookmarks'], 'readonly');

				const tags = await tx.objectStore('tags').getAll();
				const bookmarksStore = tx.objectStore('bookmarks');

				const [totalCount, ...counts] = await Promise.all([
					bookmarksStore.count(),
					...tags.map((tag) => {
						return bookmarksStore.index('tags').count(tag.id);
					}),
				]);

				const hydrated = tags.map((tag, idx): HydratedTagItem => {
					return {
						...tag,
						count: counts[idx],
					};
				});

				return { totalCount, tags: hydrated };
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
					<IconButton
						icon={FolderAddOutlinedIcon}
						title="Create folder"
						disabled={query.isLoading}
						onClick={() => {
							openModal(() => <BookmarkFolderFormDialogLazy onSave={() => query.refetch()} />);
						}}
					/>
				</Page.HeaderAccessory>
			</Page.Header>

			<Switch>
				<Match when={query.data}>
					{(data) => (
						<>
							<a
								href="/bookmarks/all"
								class="flex items-center gap-4 px-4 py-3 hover:bg-contrast/sm active:bg-contrast/sm-pressed"
							>
								<BookmarkFolderAvatar />

								<span class="min-w-0 grow overflow-hidden text-ellipsis whitespace-nowrap break-words text-sm font-bold">
									All Bookmarks
								</span>

								<div class="flex shrink-0 items-center gap-3">
									<span class="text-sm text-contrast-muted">{formatCompact(data().totalCount)}</span>
									<ChevronRightOutlinedIcon class="shrink-0 text-xl text-contrast-muted" />
								</div>
							</a>

							<For each={data().tags}>
								{(entry) => (
									<a
										href={/* @once */ `/bookmarks/${entry.id}`}
										class="flex items-center gap-4 px-4 py-3 hover:bg-contrast/sm active:bg-contrast/sm-pressed"
									>
										<BookmarkFolderAvatar color={/* @once */ entry.color} icon={/* @once */ entry.icon} />

										<span class="min-w-0 grow overflow-hidden text-ellipsis whitespace-nowrap break-words text-sm font-bold">
											{/* @once */ entry.name}
										</span>

										<div class="flex shrink-0 items-center gap-3">
											<span class="text-sm text-contrast-muted">
												{/* @once */ formatCompact(entry.count)}
											</span>
											<ChevronRightOutlinedIcon class="shrink-0 text-xl text-contrast-muted" />
										</div>
									</a>
								)}
							</For>
						</>
					)}
				</Match>
			</Switch>
		</>
	);
};

export default BookmarksPage;
