import { createMemo } from 'solid-js';

import type { AppBskyFeedDefs } from '@atcute/client/lexicons';

import { parseAtUri } from '~/api/utils/strings';

import { useModalContext } from '~/globals/modals';

import { useSession } from '~/lib/states/session';

import LinkOutlinedIcon from '~/components/icons-central/link-outline';
import OpenInNewOutlinedIcon from '~/components/icons-central/open-in-new-outline';
import ShareOutlinedIcon from '~/components/icons-central/share-outline';
import * as Menu from '~/components/menu';

import AddOutlinedIcon from '../icons-central/add-outline';
import TrashOutlinedIcon from '../icons-central/trash-outline';

export interface FeedOverflowMenuProps {
	anchor: HTMLElement;
	/** Expected to be static */
	feed: AppBskyFeedDefs.GeneratorView;
}

const hasWebShare = typeof navigator.share === 'function';

const FeedOverflowMenu = (props: FeedOverflowMenuProps) => {
	const { close } = useModalContext();
	const { currentAccount } = useSession();

	const feed = props.feed;

	const isSaved = createMemo(() => {
		if (!currentAccount) {
			return false;
		}

		const feeds = currentAccount.preferences.feeds;
		return feeds.some((f) => f.uri === feed.uri);
	});

	return (
		<Menu.Container anchor={props.anchor}>
			{currentAccount && (
				<Menu.Item
					icon={!isSaved() ? AddOutlinedIcon : TrashOutlinedIcon}
					label={!isSaved() ? `Save to my feeds` : `Remove from my feeds`}
					onClick={() => {
						close();

						const feeds = currentAccount.preferences.feeds;

						if (isSaved()) {
							const index = feeds.findIndex((f) => f.uri === feed.uri);
							feeds.splice(index, 1);
						} else {
							feeds.push({
								uri: feed.uri,
								pinned: false,
								info: {
									name: feed.displayName,
									acceptsInteraction: feed.acceptsInteractions,
									avatar: feed.avatar,
									indexedAt: feed.indexedAt,
								},
							});
						}
					}}
				/>
			)}

			<Menu.Item
				icon={hasWebShare ? ShareOutlinedIcon : LinkOutlinedIcon}
				label={`${hasWebShare ? `Share` : `Copy`} link to feed`}
				onClick={() => {
					close();

					const url = location.origin + location.pathname;

					if (hasWebShare) {
						navigator.share({ url });
					} else {
						navigator.clipboard.writeText(url);
					}
				}}
			/>

			<Menu.Item
				icon={OpenInNewOutlinedIcon}
				label="Open in Bluesky app"
				onClick={() => {
					const uri = `https://bsky.app/profile/${feed.creator.did}/feed/${parseAtUri(feed.uri).rkey}`;

					close();
					window.open(uri, '_blank');
				}}
			/>
		</Menu.Container>
	);
};

export default FeedOverflowMenu;
