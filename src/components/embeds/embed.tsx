import type {
	AppBskyEmbedExternal,
	AppBskyEmbedImages,
	AppBskyEmbedRecord,
	AppBskyFeedDefs,
	Brand,
} from '@mary/bluesky-client/lexicons';

import { ContextContentMedia, getModerationUI, type ModerationCause } from '~/api/moderation';
import { parseAtUri } from '~/api/utils/strings';

import ContentHider from '../moderation/content-hider';

import ExternalEmbed from './external-embed';
import ImageEmbed from './image-embed';
import QuoteEmbed from './quote-embed';

export interface EmbedProps {
	/** Expected to be static */
	embed: NonNullable<AppBskyFeedDefs.PostView['embed']>;
	/** Expected to be static */
	gutterTop?: boolean;
	/** Expected to be static */
	large?: boolean;
	moderation?: ModerationCause[];
}

const Embed = (props: EmbedProps) => {
	const embed = props.embed;
	const gutterTop = props.gutterTop;
	const large = props.large;

	const type = embed.$type;

	return (
		<div class={`flex flex-col gap-3` + (gutterTop ? ` mt-3` : ``)}>
			{type === 'app.bsky.embed.recordWithMedia#view' ? (
				<>
					<MediaEmbed embed={/* @once */ embed.media} moderation={props.moderation} />
					<RecordEmbed embed={/* @once */ embed.record} large={large} />
				</>
			) : type !== 'app.bsky.embed.record#view' ? (
				<MediaEmbed embed={embed} moderation={props.moderation} />
			) : (
				<RecordEmbed embed={embed} large={large} />
			)}
		</div>
	);
};

export default Embed;

interface MediaEmbedProps {
	/** Expected to be static */
	embed: Brand.Union<AppBskyEmbedExternal.View | AppBskyEmbedImages.View>;
	moderation?: ModerationCause[];
}

const MediaEmbed = (props: MediaEmbedProps) => {
	return (
		<ContentHider
			ui={getModerationUI(props.moderation, ContextContentMedia)}
			innerClass="flex flex-col mt-1.5"
			children={(() => {
				const embed = props.embed;
				const type = embed.$type;

				if (type === 'app.bsky.embed.images#view') {
					return <ImageEmbed embed={embed} interactive />;
				}

				if (type === 'app.bsky.embed.external#view') {
					return <ExternalEmbed embed={embed} interactive />;
				}

				return renderEmpty(`Unsupported media`);
			})()}
		/>
	);
};

interface RecordEmbedProps {
	/** Expected to be static */
	embed: AppBskyEmbedRecord.View;
	/** Expected to be static */
	large?: boolean;
}

const RecordEmbed = (props: RecordEmbedProps) => {
	const embed = props.embed;
	const large = props.large;

	const record = embed.record;
	const type = record.$type;

	if (type === 'app.bsky.embed.record#viewNotFound' || type === 'app.bsky.embed.record#viewBlocked') {
		const { collection } = parseAtUri(record.uri);

		if (collection === 'app.bsky.feed.post' && type === 'app.bsky.embed.record#viewBlocked') {
			const viewer = record.author.viewer;

			if (viewer?.blocking) {
				return renderEmpty(`You blocked this user`);
			}

			if (!viewer?.blockedBy) {
				return renderEmpty(`Blocked`);
			}
		}

		return renderEmpty(`This post is unavailable`);
	}

	if (type === 'app.bsky.embed.record#viewRecord') {
		return <QuoteEmbed quote={record} large={large} interactive />;
	}

	if (type === 'app.bsky.feed.defs#generatorView') {
	}

	if (type === 'app.bsky.graph.defs#listView') {
	}

	return renderEmpty(`Unsupported record`);
};

const renderEmpty = (msg: string) => {
	return (
		<div class="rounded-md border border-outline p-3">
			<p class="text-sm text-contrast-muted">{msg}</p>
		</div>
	);
};
