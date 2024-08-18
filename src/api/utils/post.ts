import type {
	AppBskyEmbedExternal,
	AppBskyEmbedImages,
	AppBskyEmbedRecord,
	AppBskyFeedDefs,
	AppBskyFeedPost,
	Brand,
} from '@atcute/client/lexicons';

type RecordEmbed = AppBskyFeedPost.Record['embed'];
type ViewEmbed = AppBskyFeedDefs.PostView['embed'];

export const unwrapPostEmbedText = (embed: RecordEmbed | ViewEmbed): string => {
	let str = '';

	const media = getMediaEmbed(embed);

	if (media) {
		const type = media.$type;

		if (type === 'app.bsky.embed.external' || type === 'app.bsky.embed.external#view') {
			str += ` ` + media.external.title;
		} else if (type === 'app.bsky.embed.images' || type === 'app.bsky.embed.images#view') {
			const images = media.images;

			for (let idx = 0, len = images.length; idx < len; idx++) {
				str += ` ` + images[idx].alt;
			}
		}
	}

	return str;
};

type RecordMedia = AppBskyEmbedExternal.Main | AppBskyEmbedImages.Main;
type ViewMedia = AppBskyEmbedExternal.View | AppBskyEmbedImages.View;

const getMediaEmbed = (embed: RecordEmbed | ViewEmbed): Brand.Union<RecordMedia | ViewMedia> | undefined => {
	if (embed) {
		const type = embed.$type;

		if (
			type === 'app.bsky.embed.external' ||
			type === 'app.bsky.embed.external#view' ||
			type === 'app.bsky.embed.images' ||
			type === 'app.bsky.embed.images#view'
		) {
			return embed;
		} else if (type === 'app.bsky.embed.recordWithMedia' || type === 'app.bsky.embed.recordWithMedia#view') {
			const media = embed.media;
			const mediatype = media.$type;

			if (
				mediatype === 'app.bsky.embed.external' ||
				mediatype === 'app.bsky.embed.external#view' ||
				mediatype === 'app.bsky.embed.images' ||
				mediatype === 'app.bsky.embed.images#view'
			) {
				return media;
			}
		}
	}
};

export const getEmbeddedPost = (
	embed: AppBskyFeedDefs.PostView['embed'],
): AppBskyEmbedRecord.ViewRecord | undefined => {
	if (embed) {
		if (embed.$type === 'app.bsky.embed.record#view') {
			if (embed.record.$type === 'app.bsky.embed.record#viewRecord') {
				return embed.record;
			}
		} else if (embed.$type === 'app.bsky.embed.recordWithMedia#view') {
			if (embed.record.record.$type === 'app.bsky.embed.record#viewRecord') {
				return embed.record.record;
			}
		}
	}
};

export const embedViewRecordToPostView = (v: AppBskyEmbedRecord.ViewRecord): AppBskyFeedDefs.PostView => {
	return {
		uri: v.uri,
		cid: v.cid,
		author: v.author,
		record: v.value,
		indexedAt: v.indexedAt,
		labels: v.labels,
		embed: v.embeds?.[0],
		likeCount: v.likeCount,
		replyCount: v.replyCount,
		repostCount: v.repostCount,
	};
};
