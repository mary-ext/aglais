import type { AppBskyFeedPost } from '@mary/bluesky-client/lexicons';
import type { UiTimelineItem } from '~/api/models/timeline';

export interface PostReplyContextProps {
	/** Expected to be static */
	item: UiTimelineItem;
}

const PostReplyContext = (props: PostReplyContextProps) => {
	const { post, reply, prev } = props.item;

	if (!prev) {
		const parent = reply?.parent;
		if (parent) {
			const author = parent.author;
			const did = author.did;
			const handle = author.handle;

			return (
				<div class="mb-0.5 flex text-sm text-c-contrast-500">
					<span class="shrink-0 whitespace-pre">Replying to </span>
					<a
						dir="auto"
						href={`/${did}`}
						class="overflow-hidden text-ellipsis whitespace-nowrap text-c-primary-400 hover:underline"
					>
						@{handle}
					</a>
				</div>
			);
		}

		const record = post.record as AppBskyFeedPost.Record;
		if (record.reply) {
			return <div class="mb-0.5 text-sm text-c-contrast-500">Replying to unknown</div>;
		}
	}
};

export default PostReplyContext;
