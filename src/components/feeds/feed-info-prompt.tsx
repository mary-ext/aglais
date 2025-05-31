import type { AppBskyFeedDefs } from '@atcute/bluesky';

import { assertCanonicalResourceUri } from '~/api/types/at-uri';

import { useModalContext } from '~/globals/modals';

import { formatLong } from '~/lib/intl/number';

import Avatar from '~/components/avatar';
import * as Prompt from '~/components/prompt';

export interface FeedInfoPromptProps {
	/** Expected to be static */
	feed: AppBskyFeedDefs.GeneratorView;
}

const FeedInfoPrompt = (props: FeedInfoPromptProps) => {
	const { close } = useModalContext();

	const feed = props.feed;

	const authorUrl = `/${feed.creator.did}`;
	const feedUrl = `${authorUrl}/feeds/${assertCanonicalResourceUri(feed.uri).rkey}`;

	return (
		<Prompt.Container maxWidth="md">
			<div>
				<Avatar type="generator" src={/* @once */ feed.avatar} size={null} class="h-12 w-12" />

				<p class="mt-4 text-xl font-bold">{/* @once */ feed.displayName.trim()}</p>
				<p class="mt-2 text-sm empty:hidden">{feed.description}</p>

				<div class="mt-2">
					<a href={`${feedUrl}/likes`} onClick={close} class="text-de text-contrast-muted hover:underline">
						{feed.likeCount === 1
							? `Liked by ${formatLong(feed.likeCount)} user`
							: `Liked by ${formatLong(feed.likeCount ?? 0)} users`}
					</a>
				</div>

				<div class="mt-4 flex gap-2">
					<Avatar
						type="user"
						src={/* @once */ feed.creator.avatar}
						href={authorUrl}
						onClick={close}
						size="xs"
					/>

					<a href={authorUrl} onClick={close} class="text-sm font-medium text-contrast-muted">
						{/* @once */ feed.creator.handle}
					</a>
				</div>
			</div>
		</Prompt.Container>
	);
};

export default FeedInfoPrompt;
