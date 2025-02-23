import type {
	AppBskyEmbedRecord,
	AppBskyEmbedRecordWithMedia,
	AppBskyFeedDefs,
	AppBskyFeedPost,
	AppBskyFeedThreadgate,
} from '@atcute/client/lexicons';

import { parseAtUri } from '~/api/types/at-uri';
import { serializeRichText } from '~/api/utils/richtext-stringify';

import { openModal, useModalContext } from '~/globals/modals';

import { assert } from '~/lib/utils/invariant';

import CircularProgressView from '~/components/circular-progress-view';
import * as Prompt from '~/components/prompt';

import ComposerDialog from '../composer/composer-dialog';
import {
	type ComposerState,
	type PostEmbed,
	type PostLinkEmbed,
	type PostMediaEmbed,
	type PostRecordEmbed,
	createPostState,
} from '../composer/lib/state';

export interface RevisePostPromptProps {
	/** Expected to be static */
	post: AppBskyFeedDefs.PostView;
	/** Expected to be static */
	onPostRevise?: () => void;
}

const RevisePostPrompt = ({ post, onPostRevise }: RevisePostPromptProps) => {
	const { close } = useModalContext();

	(async () => {
		const record = post.record as AppBskyFeedPost.Record;
		const embed = record.embed;
		const threadgate = post.threadgate?.record as AppBskyFeedThreadgate.Record | undefined;
		const embeddingDisabled = post.viewer?.embeddingDisabled;

		const draftEmbeds: PostEmbed = {};

		if (embed) {
			if (embed.$type === 'app.bsky.embed.recordWithMedia') {
				draftEmbeds.record = toRecordEmbed(embed.record);
				draftEmbeds.media = toMediaEmbed(post, embed.media);
				draftEmbeds.link = toLinkEmbed(post, embed.media);
			} else if (embed.$type === 'app.bsky.embed.record') {
				draftEmbeds.record = toRecordEmbed(embed);
			} else {
				draftEmbeds.media = toMediaEmbed(post, embed);
				draftEmbeds.link = toLinkEmbed(post, embed);
			}
		}

		const state: ComposerState = {
			active: 0,
			replyUri: record.reply?.parent.uri,
			redraftUri: post.uri,
			posts: [
				createPostState({
					text: serializeRichText(record.text, record.facets),
					embed: draftEmbeds,
					languages: record.langs,
				}),
			],
			threadgate: {
				allow: threadgate?.allow,
				hiddenReplies: threadgate?.hiddenReplies,
			},
			postgate: {
				embeddingRules: embeddingDisabled ? [{ $type: 'app.bsky.feed.postgate#disableRule' }] : [],
			},
		};

		openModal(() => <ComposerDialog initialState={state} onPublish={onPostRevise} />);
		close();
	})();

	return (
		<Prompt.Container disabled>
			<CircularProgressView />
		</Prompt.Container>
	);
};

export default RevisePostPrompt;

const toMediaEmbed = (
	post: AppBskyFeedDefs.PostView,
	embed: AppBskyEmbedRecordWithMedia.Main['media'],
): PostMediaEmbed | undefined => {
	const authorDid = post.author.did;

	switch (embed.$type) {
		case 'app.bsky.embed.images': {
			return {
				type: 'image',
				images: embed.images.map((item) => ({
					source: {
						type: 'remote',
						blob: item.image,
						aspectRatio: item.aspectRatio,
					},
					alt: item.alt,
				})),
				labels: post.labels?.filter((label) => label.src === authorDid).map((label) => label.val) ?? [],
			};
		}
		case 'app.bsky.embed.video': {
			return {
				type: 'video',
				source: {
					type: 'remote',
					blob: embed.video,
					aspectRatio: embed.aspectRatio,
				},
				alt: embed.alt ?? '',
				labels: post.labels?.filter((label) => label.src === authorDid).map((label) => label.val) ?? [],
			};
		}
	}
};

const toLinkEmbed = (
	post: AppBskyFeedDefs.PostView,
	embed: AppBskyEmbedRecordWithMedia.Main['media'],
): PostLinkEmbed | undefined => {
	const authorDid = post.author.did;

	switch (embed.$type) {
		case 'app.bsky.embed.external': {
			const uri = embed.external.uri;

			// GIF embed, ignore for now
			if (/\/\/media\.tenor\.com\/([^/]+?AAAAC)\/([^/]+?)\?hh=(\d+?)&ww=(\d+?)$/.test(uri)) {
				return;
			}

			return {
				source: { type: 'remote', state: embed },
				labels: post.labels?.filter((label) => label.src === authorDid).map((label) => label.val) ?? [],
			};
		}
	}
};

const toRecordEmbed = (embed: AppBskyEmbedRecord.Main): PostRecordEmbed | undefined => {
	const ref = embed.record;

	const uri = ref.uri;
	const { collection } = parseAtUri(uri);

	switch (collection) {
		case 'app.bsky.feed.post': {
			return { type: 'quote', uri, origin: false };
		}
		case 'app.bsky.graph.list': {
			return { type: 'list', uri };
		}
		case 'app.bsky.feed.generator': {
			return { type: 'feed', uri };
		}
	}

	assert(false, `unknown "${collection}" record type`);
};
