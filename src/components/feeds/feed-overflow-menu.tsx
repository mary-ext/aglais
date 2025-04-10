import { createMemo } from 'solid-js';

import type { AppBskyFeedDefs } from '@atcute/client/lexicons';

import { parseCanonicalResourceUri } from '~/api/types/at-uri';

import { useModalContext } from '~/globals/modals';

import { useSession } from '~/lib/states/session';
import { omit } from '~/lib/utils/misc';

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

	const saved = createMemo(() => {
		if (!currentAccount) {
			return -1;
		}

		const feeds = currentAccount.preferences.feeds;
		const index = feeds.findIndex((f) => f.type === 'generator' && f.info.uri === feed.uri);

		return index;
	});

	return (
		<Menu.Container anchor={props.anchor}>
			{currentAccount && (
				<Menu.Item
					icon={saved() === -1 ? AddOutlinedIcon : TrashOutlinedIcon}
					label={saved() === -1 ? `Save to my feeds` : `Remove from my feeds`}
					onClick={() => {
						close();

						const feeds = currentAccount.preferences.feeds;
						const index = saved();

						if (index !== -1) {
							feeds.splice(index, 1);
						} else {
							feeds.push({ type: 'generator', pinned: false, info: omit(feed, ['likeCount']) });
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
					const uri = `https://bsky.app/profile/${feed.creator.did}/feed/${parseCanonicalResourceUri(feed.uri).rkey}`;

					close();
					window.open(uri, '_blank');
				}}
			/>
		</Menu.Container>
	);
};

export default FeedOverflowMenu;
