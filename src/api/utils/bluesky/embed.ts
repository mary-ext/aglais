import type { AppBskyEmbedRecordWithMedia, AppBskyFeedPost } from '@atcute/client/lexicons';

export interface Embeds {
	media?: AppBskyEmbedRecordWithMedia.Main['media'];
	record?: AppBskyEmbedRecordWithMedia.Main['record'];
}

export type MediaEmbed = NonNullable<Embeds['media']>;
export type RecordEmbed = NonNullable<Embeds['record']>;

export const unwrapMediaEmbed = (embed: AppBskyFeedPost.Record['embed']): Embeds['media'] => {
	switch (embed?.$type) {
		case 'app.bsky.embed.recordWithMedia':
			return embed.media;
		case 'app.bsky.embed.record':
			return;
	}

	return embed;
};

export const unwrapRecordEmbed = (embed: AppBskyFeedPost.Record['embed']): Embeds['record'] => {
	switch (embed?.$type) {
		case 'app.bsky.embed.recordWithMedia':
			return embed.record;

		case 'app.bsky.embed.record':
			return embed;
	}
};

export const unwrapEmbed = (embed: AppBskyFeedPost.Record['embed']): Embeds => {
	return {
		media: unwrapMediaEmbed(embed),
		record: unwrapRecordEmbed(embed),
	};
};
