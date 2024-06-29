import { safeUrlParse } from '~/api/utils/strings';

import { BSKY_FEED_LINK_RE, BSKY_LIST_LINK_RE, BSKY_POST_LINK_RE } from '~/lib/bsky/link-detection';

import { EmbedKind, type PostExternalEmbed, type PostRecordEmbed } from './state';

export const getEmbedFromLink = (href: string): PostRecordEmbed | PostExternalEmbed => {
	const url = safeUrlParse(href);

	if (url !== null) {
		const host = url.host;
		const path = url.pathname;
		let match: RegExpExecArray | null;

		if (host === 'bsky.app') {
			if ((match = BSKY_POST_LINK_RE.exec(path))) {
				const handleOrDid = match[1];
				const rkey = match[2];

				return {
					type: EmbedKind.QUOTE,
					uri: `at://${handleOrDid}/app.bsky.feed.post/${rkey}`,
				};
			}

			if ((match = BSKY_FEED_LINK_RE.exec(path))) {
				const handleOrDid = match[1];
				const rkey = match[2];

				return {
					type: EmbedKind.FEED,
					uri: `at://${handleOrDid}/app.bsky.feed.generator/${rkey}`,
				};
			}

			if ((match = BSKY_LIST_LINK_RE.exec(path))) {
				const handleOrDid = match[1];
				const rkey = match[2];

				return {
					type: EmbedKind.LIST,
					uri: `at://${handleOrDid}/app.bsky.graph.list/${rkey}`,
				};
			}
		}
	}

	return {
		type: EmbedKind.EXTERNAL,
		uri: href,
		labels: [],
	};
};
