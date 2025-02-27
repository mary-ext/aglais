import { createMemo } from 'solid-js';

import { useModalContext } from '~/globals/modals';

import { useSession } from '~/lib/states/session';

import AddOutlinedIcon from '~/components/icons-central/add-outline';
import LinkOutlinedIcon from '~/components/icons-central/link-outline';
import OpenInNewOutlinedIcon from '~/components/icons-central/open-in-new-outline';
import ShareOutlinedIcon from '~/components/icons-central/share-outline';
import TrashOutlinedIcon from '~/components/icons-central/trash-outline';
import * as Menu from '~/components/menu';

export interface SearchOverflowMenuProps {
	anchor: HTMLElement;
	query: string;
	kind: string;
}

const hasWebShare = typeof navigator.share === 'function';

const SearchOverflowMenu = (props: SearchOverflowMenuProps) => {
	const { close } = useModalContext();
	const { currentAccount } = useSession();

	const isSaveable = createMemo(() => {
		const kind = props.kind;
		return kind === 'latest_posts' || kind === 'top_posts';
	});

	const saved = createMemo(() => {
		if (!currentAccount || !isSaveable()) {
			return -1;
		}

		const query = props.query;
		const kind = props.kind;

		const feeds = currentAccount.preferences.feeds;
		const index = feeds.findIndex((f) => f.type === 'search' && f.query === query && f.kind === kind);

		return index;
	});

	return (
		<Menu.Container anchor={props.anchor}>
			{currentAccount && isSaveable() && (
				<Menu.Item
					icon={saved() === -1 ? AddOutlinedIcon : TrashOutlinedIcon}
					label={saved() === -1 ? `Save to my feeds` : `Remove from my feeds`}
					onClick={() => {
						const query = props.query;
						const kind = props.kind;

						const feeds = currentAccount.preferences.feeds;
						const index = saved();

						close();

						if (index !== -1) {
							feeds.splice(index, 1);
						} else {
							feeds.push({ type: 'search', name: '', query, kind });
						}
					}}
				/>
			)}

			<Menu.Item
				icon={hasWebShare ? ShareOutlinedIcon : LinkOutlinedIcon}
				label={`${hasWebShare ? `Share` : `Copy`} link`}
				onClick={() => {
					const url = location.origin + location.pathname + location.search;

					close();

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
					const url = `https://bsky.app/search?q=${encodeURIComponent(props.query)}`;

					close();
					window.open(url, '_blank');
				}}
			/>
		</Menu.Container>
	);
};

export default SearchOverflowMenu;
