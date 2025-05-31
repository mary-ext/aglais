import type { AppBskyFeedDefs, AppBskyFeedPost } from '@atcute/bluesky';

import { assertCanonicalResourceUri } from '~/api/types/at-uri';
import { serializeRichText } from '~/api/utils/richtext-stringify';

import { useModalContext } from '~/globals/modals';

import ClipboardOutlinedIcon from '~/components/icons-central/clipboard-outline';
import OpenInNewOutlinedIcon from '~/components/icons-central/open-in-new-outline';
import * as Menu from '~/components/menu';

export interface PostShareMenuProps {
	anchor: HTMLElement;
	/** Expected to be static */
	post: AppBskyFeedDefs.PostView;
}

const PostShareMenu = (props: PostShareMenuProps) => {
	const { close } = useModalContext();

	const post = props.post;

	const did = post.author.did;
	const { rkey } = assertCanonicalResourceUri(post.uri);

	return (
		<Menu.Container anchor={props.anchor} placement="bottom-end">
			<Menu.Item
				icon={ClipboardOutlinedIcon}
				label="Copy link"
				onClick={() => {
					const url = new URL(`/${did}/${rkey}`, location.href);
					navigator.clipboard.writeText(url.toString()).then(close);
				}}
			/>

			<Menu.Item
				icon={ClipboardOutlinedIcon}
				label="Copy post text"
				onClick={() => {
					const record = post.record as AppBskyFeedPost.Main;
					const serialized = serializeRichText(record.text, record.facets);

					navigator.clipboard.writeText(serialized).then(close);
				}}
			/>

			<Menu.Divider />

			<Menu.Item
				icon={ClipboardOutlinedIcon}
				label="Copy link to Bluesky app"
				onClick={() => {
					const url = `https://bsky.app/profile/${did}/post/${rkey}`;
					navigator.clipboard.writeText(url).then(close);
				}}
			/>

			<Menu.Item
				icon={OpenInNewOutlinedIcon}
				label="Open in Bluesky app"
				onClick={() => {
					const url = `https://bsky.app/profile/${did}/post/${rkey}`;

					close();
					window.open(url, '_blank');
				}}
			/>

			<Menu.Divider />

			<Menu.Item
				icon={OpenInNewOutlinedIcon}
				label="Open in PDSls"
				onClick={() => {
					const url = `https://pdsls.dev/at/${did}/app.bsky.feed.post/${rkey}`;

					close();
					window.open(url, '_blank');
				}}
			/>
		</Menu.Container>
	);
};

export default PostShareMenu;
