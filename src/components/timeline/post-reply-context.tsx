import type { AppBskyFeedPost } from '@atcute/bluesky';

import type { UiTimelineItem } from '~/api/models/timeline';
import { createProfileQuery } from '~/api/queries/profile';
import { assertCanonicalResourceUri } from '~/api/types/at-uri';

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

			if (did === currentAccount?.did) {
				return <div class="mb-0.5 flex text-de text-contrast-muted">Replying to you</div>;
			}

			const handle = author.handle.toLowerCase();

			return (
				<div class="mb-0.5 flex text-de text-contrast-muted">
					<span class="shrink-0 whitespace-pre">Replying to </span>
					<a
						dir="auto"
						href={`/${did}`}
						class="overflow-hidden text-ellipsis whitespace-nowrap font-semibold hover:underline"
					>
						{handle}
					</a>
				</div>
			);
		}

		const raw = (post.record as AppBskyFeedPost.Main).reply?.parent;
		if (raw) {
			const { repo: did } = assertCanonicalResourceUri(raw.uri);

			if (did === currentAccount?.did) {
				return <div class="mb-0.5 flex text-de text-contrast-muted">Replying to you</div>;
			}

			const profile = createProfileQuery(() => did, {
				staleTime: Infinity,
				gcTime: 60_000 * 5,
			});

			return (
				<div class="mb-0.5 flex text-de text-contrast-muted">
					<span class="shrink-0 whitespace-pre">Replying to </span>
					{profile.data ? (
						<a
							dir="auto"
							href={`/${did}`}
							class="overflow-hidden text-ellipsis whitespace-nowrap font-semibold hover:underline"
						>
							{profile.data.handle.toLowerCase()}
						</a>
					) : (
						'...'
					)}
				</div>
			);
		}
	}
};

export default PostReplyContext;
