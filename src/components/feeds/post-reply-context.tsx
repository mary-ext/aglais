import type { AppBskyFeedPost } from '@mary/bluesky-client/lexicons';

import type { UiTimelineItem } from '~/api/models/timeline';
import { parseAtUri } from '~/api/utils/strings';

import { useSession } from '~/lib/states/session';

export interface PostReplyContextProps {
	/** Expected to be static */
	item: UiTimelineItem;
}

const PostReplyContext = (props: PostReplyContextProps) => {
	const { post, reply, prev } = props.item;
	const { currentAccount } = useSession();

	if (!prev) {
		const parent = reply?.parent;
		if (parent) {
			const author = parent.author;
			const did = author.did;
			const handle = author.handle;

			if (did === currentAccount?.did) {
				return <div class="mb-0.5 flex text-sm text-contrast-muted">Replying to you</div>;
			}

			return (
				<div class="mb-0.5 flex text-sm text-contrast-muted">
					<span class="shrink-0 whitespace-pre">Replying to </span>
					<a
						dir="auto"
						href={`/${did}`}
						class="overflow-hidden text-ellipsis whitespace-nowrap text-accent hover:underline"
					>
						@{handle}
					</a>
				</div>
			);
		}

		const raw = (post.record as AppBskyFeedPost.Record).reply?.parent;
		if (raw) {
			const did = parseAtUri(raw.uri).repo;
			if (did === currentAccount?.did) {
				return <div class="mb-0.5 flex text-sm text-contrast-muted">Replying to you</div>;
			}

			return <div class="mb-0.5 text-sm text-contrast-muted">Replying to unknown</div>;
		}
	}
};

export default PostReplyContext;
