import type { AppBskyFeedDefs } from '@atcute/client/lexicons';

import { parseAtUri } from '~/api/utils/strings';

import { useModalContext } from '~/globals/modals';

import * as Menu from '~/components/menu';

import ClipboardOutlinedIcon from '../icons-central/clipboard-outline';
import OpenInNewOutlinedIcon from '../icons-central/open-in-new-outline';

export interface PostShareMenuProps {
	anchor: HTMLElement;
	/** Expected to be static */
	post: AppBskyFeedDefs.PostView;
}

const PostShareMenu = (props: PostShareMenuProps) => {
	const { close } = useModalContext();

	const post = props.post;
	const uri = parseAtUri(post.uri);

	return (
		<Menu.Container anchor={props.anchor} placement="bottom-end">
			<Menu.Item
				icon={ClipboardOutlinedIcon}
				label="Copy link"
				onClick={() => {
					const url = new URL(`/${post.author.did}/${uri.rkey}`, location.href);
					navigator.clipboard.writeText(url.toString()).then(close);
				}}
			/>

			<Menu.Item
				icon={ClipboardOutlinedIcon}
				label="Copy link to Bluesky app"
				onClick={() => {
					const url = `https://bsky.app/profile/${post.author.did}/post/${uri.rkey}`;
					navigator.clipboard.writeText(url).then(close);
				}}
			/>

			<Menu.Item
				icon={OpenInNewOutlinedIcon}
				label="Open in Bluesky app"
				onClick={() => {
					const url = `https://bsky.app/profile/${post.author.did}/post/${uri.rkey}`;

					close();
					window.open(url, '_blank');
				}}
			/>
		</Menu.Container>
	);
};

export default PostShareMenu;
