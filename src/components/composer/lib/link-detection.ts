import { makeAtUri, safeUrlParse } from '~/api/utils/strings';

import { BSKY_FEED_LINK_RE, BSKY_LIST_LINK_RE, BSKY_POST_LINK_RE } from '~/lib/bsky/link-detection';

import { type PostRecordEmbed } from './state';

export const getRecordEmbedFromLink = (href: string): PostRecordEmbed | undefined => {
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
					type: 'quote',
					uri: makeAtUri(handleOrDid, 'app.bsky.feed.post', rkey),
					origin: false,
				};
			}

			if ((match = BSKY_FEED_LINK_RE.exec(path))) {
				const handleOrDid = match[1];
				const rkey = match[2];

				return {
					type: 'feed',
					uri: makeAtUri(handleOrDid, 'app.bsky.feed.generator', rkey),
				};
			}

			if ((match = BSKY_LIST_LINK_RE.exec(path))) {
				const handleOrDid = match[1];
				const rkey = match[2];

				return {
					type: 'list',
					uri: makeAtUri(handleOrDid, 'app.bsky.graph.list', rkey),
				};
			}
		}
	}
};
