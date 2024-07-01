import { createMemo, createResource } from 'solid-js';

import type { AppBskyFeedDefs } from '@mary/bluesky-client/lexicons';

import { useModalContext } from '~/globals/modals';

import { useBookmarks } from '~/lib/states/bookmarks';

import BookmarkCheckOutlinedIcon from '../icons-central/bookmark-check-outline';
import BookmarkOutlinedIcon from '../icons-central/bookmark-outline';
import * as Menu from '../menu';

export interface PostOverflowMenuProps {
	anchor: HTMLElement;
	/** Expected to be static */
	post: AppBskyFeedDefs.PostView;
}

const PostOverflowMenu = (props: PostOverflowMenuProps) => {
	const { close } = useModalContext();
	const bookmarks = useBookmarks();

	const post = props.post;

	const [bookmarked] = createResource(async () => {
		const db = await bookmarks.open();
		const result = await db.get('bookmarks', post.uri);

		return result ? { bookmarkedAt: result.bookmarked_at, tags: result.tags } : undefined;
	});

	const isBookmarked = createMemo(() => {
		return bookmarked.state === 'ready' && bookmarked.latest !== undefined;
	});

	return (
		<Menu.Container anchor={props.anchor} placement="bottom-end" cover>
			<Menu.Item
				icon={!isBookmarked() ? BookmarkOutlinedIcon : BookmarkCheckOutlinedIcon}
				label={!isBookmarked() ? `Bookmark` : `Remove bookmark`}
				disabled={bookmarked.state !== 'ready'}
				onClick={async () => {
					close();

					const db = await bookmarks.open();

					if (isBookmarked()) {
						db.delete('bookmarks', post.uri);
					} else {
						db.add('bookmarks', {
							view: post,
							bookmarked_at: Date.now(),
							tags: [],
						});
					}
				}}
			/>
		</Menu.Container>
	);
};

export default PostOverflowMenu;
