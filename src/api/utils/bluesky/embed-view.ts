import type { AppBskyEmbedRecordWithMedia, AppBskyFeedDefs } from '@atcute/client/lexicons';

import { parseCanonicalResourceUri } from '~/api/types/at-uri';

export interface EmbedsView {
	media?: AppBskyEmbedRecordWithMedia.View['media'];
	record?: AppBskyEmbedRecordWithMedia.View['record']['record'];
}

export type MediaEmbedView = NonNullable<EmbedsView['media']>;
export type RecordEmbedView = NonNullable<EmbedsView['record']>;

export const unwrapMediaEmbedView = (embed: AppBskyFeedDefs.PostView['embed']): EmbedsView['media'] => {
	switch (embed?.$type) {
		case 'app.bsky.embed.recordWithMedia#view':
			return embed.media;
		case 'app.bsky.embed.record#view':
			return;
	}

	return embed;
};

export const unwrapRecordEmbedView = (embed: AppBskyFeedDefs.PostView['embed']): EmbedsView['record'] => {
	switch (embed?.$type) {
		case 'app.bsky.embed.recordWithMedia#view':
			return embed.record.record;

		case 'app.bsky.embed.record#view':
			return embed.record;
	}
};

export const unwrapEmbedView = (embed: AppBskyFeedDefs.PostView['embed']): EmbedsView => {
	return {
		media: unwrapMediaEmbedView(embed),
		record: unwrapRecordEmbedView(embed),
	};
};

export const getQuoteEmbedView = (embed: RecordEmbedView | undefined) => {
	switch (embed?.$type) {
		case 'app.bsky.embed.record#viewRecord': {
			return embed;
		}

		case 'app.bsky.embed.record#viewNotFound':
		case 'app.bsky.embed.record#viewDetached':
		case 'app.bsky.embed.record#viewBlocked': {
			const uri = parseCanonicalResourceUri(embed.uri);
			if (uri.collection === 'app.bsky.feed.post') {
				return embed;
			}
		}
	}
};
