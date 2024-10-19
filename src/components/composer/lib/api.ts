import { XRPCError } from '@atcute/client';
import type {
	AppBskyEmbedImages,
	AppBskyEmbedRecord,
	AppBskyEmbedRecordWithMedia,
	AppBskyFeedDefs,
	AppBskyFeedPost,
	AppBskyFeedThreadgate,
	AppBskyGraphDefs,
	AppBskyRichtextFacet,
	At,
	BlueMojiRichtextFacet,
	Brand,
	ComAtprotoLabelDefs,
	ComAtprotoRepoApplyWrites,
	ComAtprotoRepoStrongRef,
} from '@atcute/client/lexicons';
import * as TID from '@atcute/tid';
import type { QueryClient } from '@mary/solid-query';

import { uploadBlob } from '~/api/queries/blob';
import type { LinkMeta } from '~/api/queries/composer';
import { getRecord } from '~/api/utils/records';
import { trimRichText } from '~/api/utils/richtext';
import { makeAtUri } from '~/api/utils/strings';
import { getUtf8Length } from '~/api/utils/unicode';

import { compressPostImage } from '~/lib/bsky/image';
import type { AgentContext } from '~/lib/states/agent';
import { assert } from '~/lib/utils/invariant';

import {
	type ComposerState,
	type ParsedRichText,
	type PostEmbed,
	type PostLinkEmbed,
	type PostMediaEmbed,
	type PostRecordEmbed,
	getEmbedLabels,
	parseRichText,
} from './state';

export interface PublishOptions {
	agent: AgentContext;
	queryClient: QueryClient;
	state: ComposerState;
	onLog?: (msg: string) => void;
}

let cidPromise: Promise<typeof import('./cid')>;

export const publish = async ({ agent, queryClient, state, onLog: log }: PublishOptions) => {
	const rpc = agent.rpc;
	const did = agent.did!;

	const now = new Date();
	const writes: Brand.Union<ComAtprotoRepoApplyWrites.Create>[] = [];

	let reply: AppBskyFeedPost.ReplyRef | undefined;
	let rkey: string | undefined;

	if (state.reply) {
		const post = state.reply;
		const root = (post.record as AppBskyFeedPost.Record).reply?.root;

		const ref: ComAtprotoRepoStrongRef.Main = {
			uri: post.uri,
			cid: post.cid,
		};

		reply = {
			root: root ?? ref,
			parent: ref,
		};
	}

	for (let idx = 0, len = state.posts.length; idx < len; idx++) {
		log?.(`Processing`);

		// Get the record key for this post
		rkey = TID.now();

		const post = state.posts[idx];
		const uri = makeAtUri(did, 'app.bsky.feed.post', rkey);

		// Resolve rich text
		const rt = await resolveRichText(parseRichText(trimRichText(post.text)));

		// Resolve embeds
		let embed: AppBskyFeedPost.Record['embed'];
		if (post.embed) {
			embed = await resolveEmbed(post.embed);
		}

		// Get the self-labels
		const labels = getEmbedLabels(post.embed);
		let selfLabels: Brand.Union<ComAtprotoLabelDefs.SelfLabels> | undefined;

		if (labels?.length) {
			selfLabels = {
				$type: 'com.atproto.label.defs#selfLabels',
				values: labels.map((val) => ({ val })),
			};
		}

		// Now form the record
		const record: AppBskyFeedPost.Record = {
			$type: 'app.bsky.feed.post',
			createdAt: now.toISOString(),
			text: rt.text,
			facets: rt.facets,
			reply: reply,
			embed: embed,
			langs: post.languages,
			labels: selfLabels,
		};

		writes.push({
			$type: 'com.atproto.repo.applyWrites#create',
			collection: 'app.bsky.feed.post',
			rkey: rkey,
			value: record,
		});

		// If this is the first post, and we have a threadgate set, create one now.
		if (idx === 0 && state.threadgate) {
			const threadgateRecord: AppBskyFeedThreadgate.Record = {
				$type: 'app.bsky.feed.threadgate',
				createdAt: now.toISOString(),
				post: uri,
				allow: state.threadgate,
			};

			writes.push({
				$type: 'com.atproto.repo.applyWrites#create',
				collection: 'app.bsky.feed.threadgate',
				rkey: rkey,
				value: threadgateRecord,
			});
		}

		// Retrieve the next ref
		if (idx !== len - 1) {
			const { serializeRecordCid } = await (cidPromise ||= import('./cid'));

			const serialized = await serializeRecordCid(record);

			const ref: ComAtprotoRepoStrongRef.Main = {
				cid: serialized,
				uri: uri,
			};

			reply = {
				root: reply ? reply.root : ref,
				parent: ref,
			};

			// The sorting behavior for multiple posts sharing the same createdAt time
			// is undefined, so what we'll do here is increment the time by 1 ms
			// for every post
			now.setMilliseconds(now.getMilliseconds() + 1);
		}
	}

	log?.(`Posting`);

	await rpc.call('com.atproto.repo.applyWrites', {
		data: {
			repo: did,
			writes: writes,
		},
	});

	return writes;

	async function resolveEmbed(root: PostEmbed): Promise<AppBskyFeedPost.Record['embed']> {
		let pMedia: Promise<AppBskyEmbedRecordWithMedia.Main['media']> | undefined;
		let pRecord: Promise<Brand.Union<AppBskyEmbedRecord.Main>> | undefined;

		if (root.media) {
			pMedia = resolveMediaEmbed(root.media);
		} else if (root.link) {
			pMedia = resolveLinkEmbed(root.link);
		}

		if (root.record) {
			pRecord = resolveRecordEmbed(root.record);
		}

		if (pMedia && pRecord) {
			const [media, record] = await Promise.all([pMedia, pRecord]);

			return {
				$type: 'app.bsky.embed.recordWithMedia',
				media: media,
				record: record,
			};
		} else if (pMedia) {
			return await pMedia;
		} else if (pRecord) {
			return await pRecord;
		}

		assert(false);

		async function resolveMediaEmbed(
			embed: PostMediaEmbed,
		): Promise<AppBskyEmbedRecordWithMedia.Main['media']> {
			if (embed.type === 'image') {
				log?.(`Uploading images`);

				const images: AppBskyEmbedImages.Image[] = [];

				for (const image of embed.images) {
					const compressed = await compressPostImage(image.blob);
					const result = await uploadBlob(rpc, compressed.blob);

					images.push({
						image: result,
						alt: image.alt,
						aspectRatio: compressed.ratio,
					});
				}

				return {
					$type: 'app.bsky.embed.images',
					images: images,
				};
			}

			if (embed.type === 'gif') {
				const gif = embed.gif;
				const alt = embed.alt;

				let thumbBlob: At.Blob<any> | undefined;

				{
					log?.(`Retrieving GIF thumbnail`);
					const response = await fetch(gif.thumbUrl);
					if (!response.ok) {
						throw new Error(`NetworkError`);
					}

					const gifBlob = await response.blob();

					log?.(`Uploading GIF thumbnail`);
					const compressed = await compressPostImage(gifBlob);
					const blob = await uploadBlob(rpc, compressed.blob);

					thumbBlob = blob;
				}

				return {
					$type: 'app.bsky.embed.external',
					external: {
						uri: gif.embedUrl,
						title: gif.alt,
						description: alt !== undefined ? `Alt: ${alt}` : `ALT: ${gif.alt}`,
						thumb: thumbBlob,
					},
				};
			}

			assert(false);
		}

		async function resolveLinkEmbed(link: PostLinkEmbed): Promise<AppBskyEmbedRecordWithMedia.Main['media']> {
			const meta = await queryClient.fetchQuery<LinkMeta>({
				queryKey: ['link-meta', link.uri],
			});

			// compress... upload...
			const thumb = meta.thumb;
			let thumbBlob: At.Blob<any> | undefined;

			if (thumb !== undefined) {
				log?.(`Uploading link thumbnail`);

				const compressed = await compressPostImage(thumb);
				const blob = await uploadBlob(rpc, compressed.blob);

				thumbBlob = blob;
			}

			return {
				$type: 'app.bsky.embed.external',
				external: {
					uri: meta.uri,
					title: meta.title,
					description: meta.description,
					thumb: thumbBlob,
				},
			};
		}

		async function resolveRecordEmbed(
			record: PostRecordEmbed,
		): Promise<Brand.Union<AppBskyEmbedRecord.Main>> {
			const type = record.type;

			if (type === 'feed') {
				const feed = await queryClient.fetchQuery<AppBskyFeedDefs.GeneratorView>({
					queryKey: ['feed-meta', record.uri],
				});

				return {
					$type: 'app.bsky.embed.record',
					record: {
						uri: feed.uri,
						cid: feed.cid,
					},
				};
			} else if (type === 'list') {
				const list = await queryClient.fetchQuery<AppBskyGraphDefs.ListView>({
					queryKey: ['list-meta', record.uri],
				});

				return {
					$type: 'app.bsky.embed.record',
					record: {
						uri: list.uri,
						cid: list.cid,
					},
				};
			} else if (type === 'quote') {
				const post = await queryClient.fetchQuery<AppBskyFeedDefs.PostView>({
					queryKey: ['post', record.uri],
				});

				return {
					$type: 'app.bsky.embed.record',
					record: {
						uri: post.uri,
						cid: post.cid,
					},
				};
			}

			assert(false);
		}
	}

	async function resolveRichText({ tokens }: ParsedRichText) {
		const facets: AppBskyRichtextFacet.Main[] = [];

		let utf8Length = 0;

		for (let idx = 0, len = tokens.length; idx < len; idx++) {
			const token = tokens[idx];

			const index = {
				byteStart: utf8Length,
				byteEnd: (utf8Length += getUtf8Length(token.raw)),
			};

			const type = token.type;

			if (index.byteStart === index.byteEnd) {
				continue;
			}

			if (type === 'link' || type === 'autolink') {
				facets.push({
					index: index,
					features: [{ $type: 'app.bsky.richtext.facet#link', uri: token.url }],
				});
			} else if (type === 'mention') {
				const handle = token.handle;

				if (handle === 'handle.invalid') {
					throw new InvalidHandleError(handle);
				}

				try {
					const response = await rpc.get('com.atproto.identity.resolveHandle', {
						params: {
							handle: handle,
						},
					});

					const did = response.data.did;

					facets.push({
						index: index,
						features: [{ $type: 'app.bsky.richtext.facet#mention', did: did }],
					});
				} catch (err) {
					if (err instanceof XRPCError && err.kind === 'InvalidRequest') {
						throw new InvalidHandleError(handle);
					}

					throw err;
				}
			} else if (type === 'topic') {
				facets.push({
					index: index,
					features: [{ $type: 'app.bsky.richtext.facet#tag', tag: token.name }],
				});
			} else if (type === 'emote') {
				const { value } = await getRecord(rpc, {
					repo: did,
					collection: 'blue.moji.collection.item',
					rkey: token.name,
				});

				const raws = value.formats;

				const cids: Brand.Union<BlueMojiRichtextFacet.Formats_v0> = {
					$type: 'blue.moji.richtext.facet#formats_v0',
				};

				if (raws.$type === 'blue.moji.collection.item#formats_v0') {
					if (raws.apng_128) {
						cids.apng_128 = true;
					}

					if (raws.lottie) {
						cids.lottie = true;
					}

					if (raws.gif_128) {
						cids.gif_128 = raws.gif_128.ref.$link;
					}

					if (raws.png_128) {
						cids.png_128 = raws.png_128.ref.$link;
					}

					if (raws.webp_128) {
						cids.webp_128 = raws.webp_128.ref.$link;
					}
				}

				const facet: Brand.Union<BlueMojiRichtextFacet.Main> = {
					$type: 'blue.moji.richtext.facet',
					did: did,
					name: token.raw,
					alt: value.alt || undefined,
					adultOnly: value.adultOnly || undefined,
					labels: value.labels,
					formats: cids,
				};

				facets.push({
					index: index,
					features: [
						facet as any,
						{
							$type: 'app.bsky.richtext.facet#link',
							uri: 'https://github.com/aendra-rininsland/bluemoji',
						},
					],
				});
			}
		}

		return { text: tokens.reduce((accu, token) => accu + token.raw, ''), facets: facets };
	}
};

export class InvalidHandleError extends Error {}
