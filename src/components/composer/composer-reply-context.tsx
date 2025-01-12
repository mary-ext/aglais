import { Match, Switch, createMemo } from 'solid-js';

import type { AppBskyEmbedImages, AppBskyFeedDefs, AppBskyFeedPost } from '@atcute/client/lexicons';

import { getModerationUI } from '~/api/moderation';
import { ContextContentMedia } from '~/api/moderation/constants';
import { moderatePost } from '~/api/moderation/entities/post';
import { createPostQuery } from '~/api/queries/post';
import { formatQueryError } from '~/api/utils/error';

import { useModerationOptions } from '~/lib/states/moderation';

import Avatar, { getUserAvatarType } from '../avatar';
import Button from '../button';
import CircularProgress from '../circular-progress';
import ImageGridEmbed from '../embeds/image-grid-embed';
import TimeAgo from '../time-ago';

export interface ComposerReplyContextProps {
	/** Expected to be static */
	replyUri: string;
	pending?: boolean;
}

const ComposerReplyContext = (props: ComposerReplyContextProps) => {
	const moderationOptions = useModerationOptions();

	const query = createPostQuery(() => props.replyUri);

	return (
		<Switch>
			<Match when={query.data} keyed>
				{(post) => {
					const author = post.author;
					const record = post.record as AppBskyFeedPost.Record;

					const moderation = createMemo(() => moderatePost(post, moderationOptions()));
					const shouldBlurImage = () => getModerationUI(moderation(), ContextContentMedia).b.length !== 0;

					const image = getPostImage(post.embed);

					return (
						<div class="relative flex gap-3 px-4 pt-3">
							<div class="flex shrink-0 flex-col items-center">
								<Avatar
									type={/* @once */ getUserAvatarType(author)}
									src={/* @once */ author.avatar}
									moderation={moderation()}
									class={props.pending ? `opacity-50` : ``}
								/>

								<div class="mt-1 grow border-l-2 border-outline-md" />
							</div>

							<div class={`min-w-0 grow pb-3` + (props.pending ? ` opacity-50` : ``)}>
								<div class="mb-0.5 flex items-center justify-between gap-4 text-contrast-muted">
									<div class="flex items-center overflow-hidden text-sm">
										<span class="overflow-hidden text-ellipsis">
											<span class="font-semibold text-contrast hover:underline">
												{/* @once */ author.handle.toLowerCase()}
											</span>
										</span>

										<span class="pl-2"> </span>

										<TimeAgo value={/* @once */ post.indexedAt}>
											{(relative, absolute) => (
												<span title={absolute()} class="whitespace-nowrap">
													{relative()}
												</span>
											)}
										</TimeAgo>
									</div>
								</div>

								<div class="flex items-start gap-4">
									<div class="line-clamp-6 min-w-0 grow-4 basis-0 whitespace-pre-wrap break-words text-sm">
										{/* @once */ record.text}
									</div>

									{image && (
										<div class="grow basis-0">
											<ImageGridEmbed embed={image} blur={shouldBlurImage()} />
										</div>
									)}
								</div>
							</div>
						</div>
					);
				}}
			</Match>

			<Match when={query.error} keyed>
				{(error) => (
					<div class="relative flex gap-3 px-4 pt-3">
						<div class="flex shrink-0 flex-col items-center">
							<div class="h-9 w-9 rounded-full bg-outline-md"></div>

							<div class="mt-1 grow border-l-2 border-outline-md" />
						</div>

						<div class="min-w-0 grow pb-3">
							<div class="mb-4 text-sm">
								<p class="font-bold">Something went wrong</p>
								<p class="text-muted-fg">{formatQueryError(error)}</p>
							</div>

							<div class="flex flex-wrap gap-4">
								<Button onClick={() => query.refetch()} variant="primary">
									Try again
								</Button>
							</div>
						</div>
					</div>
				)}
			</Match>

			<Match when>
				<div class="relative flex gap-3 px-4 pt-3">
					<div class="flex shrink-0 flex-col items-center">
						<div class="h-9 w-9 rounded-full bg-outline-md"></div>

						<div class="mt-1 grow border-l-2 border-outline-md" />
					</div>

					<div class="grid min-w-0 grow place-items-center pb-3">
						<div class="my-1.5">
							<CircularProgress />
						</div>
					</div>
				</div>
			</Match>
		</Switch>
	);
};

export default ComposerReplyContext;

const getPostImage = (embed: AppBskyFeedDefs.PostView['embed']): AppBskyEmbedImages.View | undefined => {
	if (embed) {
		if (embed.$type === 'app.bsky.embed.images#view') {
			return embed;
		}

		if (embed.$type === 'app.bsky.embed.recordWithMedia#view') {
			return getPostImage(embed.media);
		}
	}
};
