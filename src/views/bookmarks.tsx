import { For, Match, Switch } from 'solid-js';

import { createBookmarkMetaQuery } from '~/api/queries/bookmark';

import { openModal } from '~/globals/modals';

import { formatCompact } from '~/lib/intl/number';

import IconButton from '~/components/icon-button';
import ChevronRightOutlinedIcon from '~/components/icons-central/chevron-right-outline';
import FolderAddOutlinedIcon from '~/components/icons-central/folder-add-outline';
import * as Page from '~/components/page';

import BookmarkFolderAvatar from '~/components/bookmarks/bookmark-folder-avatar';
import BookmarkFolderFormDialogLazy from '~/components/bookmarks/bookmark-folder-form-dialog-lazy';

const BookmarksPage = () => {
	const query = createBookmarkMetaQuery();

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
