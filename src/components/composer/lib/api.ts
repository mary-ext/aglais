import { XRPCError } from '@atcute/client';
import type {
	AppBskyEmbedExternal,
	AppBskyEmbedImages,
	AppBskyEmbedRecord,
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
import { getUtf8Length } from '~/api/richtext/intl';
import type { PreliminaryRichText } from '~/api/richtext/parser/parse';

import { compressPostImage } from '~/lib/bsky/image';
import { assert } from '~/lib/invariant';
import type { AgentContext } from '~/lib/states/agent';

import {
	EmbedKind,
	getEmbedLabels,
	getPostRt,
	type ComposerState,
	type PostEmbed,
	type PostMediaEmbed,
	type PostRecordEmbed,
} from './state';
import { getRecord } from '~/api/utils/mutation';

export interface PublishOptions {
	agent: AgentContext;
	queryClient: QueryClient;
	state: ComposerState;
	onLog?: (msg: string) => void;
}

let cidPromise: Promise<typeof import('./cid')>;

export const publish = async ({ agent, queryClient, state, onLog: log }: PublishOptions) => {
	const rpc = agent.rpc;
	const did = agent.auth!.session!.did;

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

		// The sorting behavior for multiple posts sharing the same createdAt time is
		// undefined, so what we'll do here is increment the time by 1 for every post
		now.setMilliseconds(idx);

		// Get the record key for this post
		rkey = TID.now();

		const post = state.posts[idx];
		const uri = `at://${did}/app.bsky.feed.post/${rkey}`;

		// Resolve rich text
		const rt = await resolveRichtext(getPostRt(post));

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
		const record: AppBskyFeedPost.Record & { $type: string } = {
			// IMPORTANT: $type has to exist, CID is calculated with the `$type` field
			// present and will produce the wrong CID if you omit it.
			// `createRecord` and `applyWrites` currently lets you omit this and it'll
			// add it for you, but we want to avoid that here.
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
		async function resolveMediaEmbed(
			embed: PostMediaEmbed,
		): Promise<Brand.Union<AppBskyEmbedExternal.Main | AppBskyEmbedImages.Main>> {
			const type = embed.type;

			if (type === EmbedKind.EXTERNAL) {
				const meta = await queryClient.fetchQuery<LinkMeta>({
					queryKey: ['link-meta', embed.uri],
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
			} else if (type === EmbedKind.GIF) {
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
			} else if (type === EmbedKind.IMAGE) {
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

			assert(false, `Unreachable code`);
		}

		async function resolveRecordEmbed(embed: PostRecordEmbed): Promise<Brand.Union<AppBskyEmbedRecord.Main>> {
			const type = embed.type;

			if (type === EmbedKind.FEED) {
				const feed = await queryClient.fetchQuery<AppBskyFeedDefs.GeneratorView>({
					queryKey: ['feed-meta', embed.uri],
				});

				return {
					$type: 'app.bsky.embed.record',
					record: {
						uri: feed.uri,
						cid: feed.cid,
					},
				};
			} else if (type === EmbedKind.LIST) {
				const list = await queryClient.fetchQuery<AppBskyGraphDefs.ListView>({
					queryKey: ['list-meta', embed.uri],
				});

				return {
					$type: 'app.bsky.embed.record',
					record: {
						uri: list.uri,
						cid: list.cid,
					},
				};
			} else if (type === EmbedKind.QUOTE) {
				const post = await queryClient.fetchQuery<AppBskyFeedDefs.PostView>({
					queryKey: ['post', embed.uri],
				});

				return {
					$type: 'app.bsky.embed.record',
					record: {
						uri: post.uri,
						cid: post.cid,
					},
				};
			}

			assert(false, `Unreachable code`);
		}

		if (root.type === EmbedKind.RECORD_WITH_MEDIA) {
			return {
				$type: 'app.bsky.embed.recordWithMedia',
				record: await resolveRecordEmbed(root.record),
				media: await resolveMediaEmbed(root.media),
			};
		} else if (root.type & EmbedKind.MEDIA) {
			return await resolveMediaEmbed(root as PostMediaEmbed);
		} else {
			return await resolveRecordEmbed(root as PostRecordEmbed);
		}
	}

	async function resolveRichtext(rt: PreliminaryRichText) {
		const segments = rt.segments;
		const facets: AppBskyRichtextFacet.Main[] = [];

		let utf8Length = 0;

		for (let i = 0, ilen = segments.length; i < ilen; i++) {
			const segment = segments[i];

			const index = {
				byteStart: utf8Length,
				byteEnd: (utf8Length += getUtf8Length(segment.text)),
			};

			const type = segment.type;

			if (type === 'link' || type === 'mdlink') {
				facets.push({
					index: index,
					features: [{ $type: 'app.bsky.richtext.facet#link', uri: segment.uri }],
				});
			} else if (type === 'mention') {
				const handle = segment.handle;

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
			} else if (type === 'tag') {
				facets.push({
					index: index,
					features: [{ $type: 'app.bsky.richtext.facet#tag', tag: segment.tag }],
				});
			} else if (type === 'emote') {
				const { value } = await getRecord(rpc, {
					repo: did,
					collection: 'blue.moji.collection.item',
					rkey: segment.name,
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
					name: segment.raw,
					alt: value.alt || undefined,
					adultOnly: value.adultOnly || undefined,
					labels: value.labels,
					formats: cids,
				};

				facets.push({
					index: index,
					features: [facet as any],
				});
			}
		}

		return { text: rt.text, facets: facets };
	}
};

export class InvalidHandleError extends Error {}
