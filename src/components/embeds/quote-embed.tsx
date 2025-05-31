import { type JSX, createMemo } from 'solid-js';

import { AppBskyEmbedRecord, AppBskyFeedPost, unwrapMediaEmbed } from '@atcute/bluesky';

import { getModerationUI } from '~/api/moderation';
import { ContextContentMedia } from '~/api/moderation/constants';
import { moderateQuote } from '~/api/moderation/entities/quote';
import { assertCanonicalResourceUri } from '~/api/types/at-uri';

import { inject } from '~/lib/states/singleton';
import ModerationService from '~/lib/states/singletons/moderation';

import Avatar, { getUserAvatarType } from '../avatar';
import TimeAgo from '../time-ago';

import ImageGridEmbed from './image-grid-embed';
import VideoEmbed from './video-embed';

export interface QuoteEmbedProps {
	/** Expected to be static */
	quote: AppBskyEmbedRecord.ViewRecord;
	/** Expected to be static */
	interactive?: boolean;
	/** Expected to be static. Whether it should show a large UI for image embeds */
	large?: boolean;
}

const QuoteEmbed = ({ quote, interactive, large }: QuoteEmbedProps) => {
	const moderationOptions = inject(ModerationService);

	const record = quote.value as AppBskyFeedPost.Main;
	const author = quote.author;

	const uri = assertCanonicalResourceUri(quote.uri);
	const href = `/${author.did}/${uri.rkey}`;

	const text = record.text.trim();
	const media = unwrapMediaEmbed(quote.embeds?.[0]);

	const moderation = createMemo(() => moderateQuote(quote, moderationOptions()));

	const shouldBlurMedia = () => getModerationUI(moderation(), ContextContentMedia).b.length !== 0;

	return (
		<a
			href={interactive ? href : undefined}
			class={
				`block overflow-hidden rounded-md border border-outline` +
				(interactive ? ` hover:bg-contrast/sm active:bg-contrast/sm-pressed` : ``)
			}
		>
			<div class="mx-3 mt-3 flex min-w-0 text-sm text-contrast-muted">
				<Avatar
					type={/* @once */ getUserAvatarType(author)}
					src={/* @once */ author.avatar}
					moderation={moderation()}
					size="xs"
					class="mr-2"
				/>

				<span class="overflow-hidden text-ellipsis whitespace-nowrap">
					<span class="font-semibold text-contrast">{/* @once */ author.handle.toLowerCase()}</span>
				</span>

				<span class="pl-2"></span>

				<span class="whitespace-nowrap">
					<TimeAgo value={/* @once */ quote.indexedAt}>
						{(relative, _absolute) => relative as unknown as JSX.Element}
					</TimeAgo>
				</span>
			</div>

			{text ? (
				<div class="flex items-start">
					{
						/* @once */ !large && media ? (
							media.$type === 'app.bsky.embed.images#view' ? (
								<div class="mb-3 ml-3 mt-2 grow basis-0">
									<ImageGridEmbed embed={media} blur={shouldBlurMedia()} />
								</div>
							) : media.$type === 'app.bsky.embed.video#view' ? (
								<div class="mb-3 ml-3 mt-2 grow basis-0">
									<VideoEmbed embed={media} blur={shouldBlurMedia()} />
								</div>
							) : null
						) : null
					}

					<div class="mx-3 mb-3 mt-2 line-clamp-6 min-w-0 grow-4 basis-0 whitespace-pre-wrap break-words text-sm empty:hidden">
						{text}
					</div>
				</div>
			) : (
				<div class="mt-3"></div>
			)}

			{
				/* @once */ (large || !text) && media ? (
					media.$type === 'app.bsky.embed.images#view' ? (
						<ImageGridEmbed embed={media} borderless blur={shouldBlurMedia()} />
					) : media.$type === 'app.bsky.embed.video#view' ? (
						<VideoEmbed embed={media} borderless blur={shouldBlurMedia()} />
					) : null
				) : null
			}
		</a>
	);
};

export default QuoteEmbed;
