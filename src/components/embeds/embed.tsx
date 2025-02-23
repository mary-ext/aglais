import type { AppBskyFeedDefs } from '@atcute/client/lexicons';

import { type ModerationCause, getModerationUI } from '~/api/moderation';
import { ContextContentMedia } from '~/api/moderation/constants';
import { parseAtUri } from '~/api/types/at-uri';
import { type MediaEmbedView, type RecordEmbedView, unwrapEmbedView } from '~/api/utils/bluesky/embed-view';

import ContentHider from '../moderation/content-hider';

import ExternalEmbed from './external-embed';
import FeedEmbed from './feed-embed';
import ImageStandaloneEmbed from './image-standalone-embed';
import ListEmbed from './list-embed';
import QuoteBlockedEmbed from './quote-blocked-embed';
import QuoteEmbed from './quote-embed';
import VideoEmbed from './video-embed';

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
	const { media, record } = unwrapEmbedView(props.embed);

	const gutterTop = props.gutterTop;
	const large = props.large;

	return (
		<div class={`flex flex-col gap-3` + (gutterTop ? ` mt-3` : ``)}>
			{media && <MediaEmbed embed={media} moderation={props.moderation} />}
			{record && <RecordEmbed embed={record} large={large} />}
		</div>
	);
};

export default Embed;

interface MediaEmbedProps {
	/** Expected to be static */
	embed: MediaEmbedView;
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

				if (type === 'app.bsky.embed.images#view' && embed.images.length > 0) {
					return <ImageStandaloneEmbed embed={embed} />;
				}

				if (type === 'app.bsky.embed.external#view') {
					return <ExternalEmbed embed={embed} interactive />;
				}

				if (type === 'app.bsky.embed.video#view') {
					return <VideoEmbed embed={embed} interactive standalone />;
				}

				return renderEmpty(`Unsupported media`);
			})()}
		/>
	);
};

interface RecordEmbedProps {
	/** Expected to be static */
	embed: RecordEmbedView;
	/** Expected to be static */
	large?: boolean;
}

const RecordEmbed = (props: RecordEmbedProps) => {
	const embed = props.embed;
	const large = props.large;

	const type = embed.$type;

	if (type === 'app.bsky.embed.record#viewRecord') {
		return <QuoteEmbed quote={embed} large={large} interactive />;
	}

	if (type === 'app.bsky.feed.defs#generatorView') {
		return <FeedEmbed feed={embed} interactive />;
	}

	if (type === 'app.bsky.graph.defs#listView') {
		return <ListEmbed list={embed} interactive />;
	}

	if (type === 'app.bsky.embed.record#viewNotFound' || type === 'app.bsky.embed.record#viewBlocked') {
		const uri = parseAtUri(embed.uri);

		if (type === 'app.bsky.embed.record#viewBlocked' && uri.collection === 'app.bsky.feed.post') {
			return <QuoteBlockedEmbed embed={embed} uri={uri} />;
		}

		const resource = collectionToLabel(uri.collection);
		if (resource) {
			return renderEmpty(`This ${resource} is unavailable`);
		}
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

const collectionToLabel = (collection: string): string | null => {
	switch (collection) {
		case 'app.bsky.feed.post':
			return 'post';
		case 'app.bsky.feed.generator':
			return 'feed';
		case 'app.bsky.graph.list':
			return 'list';
		case 'app.bsky.graph.starterpack':
			return 'starter pack';
		case 'app.bsky.labeler.service':
			return 'labeler';
	}

	return null;
};
