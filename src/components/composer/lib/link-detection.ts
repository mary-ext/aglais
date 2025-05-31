import type { ActorIdentifier } from '@atcute/lexicons';

import { makeAtUri } from '~/api/types/at-uri';
import { safeUrlParse } from '~/api/utils/strings';

import { BSKY_FEED_LINK_RE, BSKY_LIST_LINK_RE, BSKY_POST_LINK_RE } from '~/lib/bsky/url';

import { type PostRecordEmbed } from './state';

export const getRecordEmbedFromLink = (href: string): PostRecordEmbed | undefined => {
	const url = safeUrlParse(href);

	if (url !== null) {
		const host = url.host;
		const path = url.pathname;
		let match: RegExpExecArray | null;

		if (host === 'bsky.app') {
			if ((match = BSKY_POST_LINK_RE.exec(path))) {
				const didOrHandle = match[1] as ActorIdentifier;
				const rkey = match[2];

				return {
					type: 'quote',
					uri: makeAtUri(didOrHandle, 'app.bsky.feed.post', rkey),
					origin: false,
				};
			}

			if ((match = BSKY_FEED_LINK_RE.exec(path))) {
				const didOrHandle = match[1] as ActorIdentifier;
				const rkey = match[2];

				return {
					type: 'feed',
					uri: makeAtUri(didOrHandle, 'app.bsky.feed.generator', rkey),
				};
			}

			if ((match = BSKY_LIST_LINK_RE.exec(path))) {
				const didOrHandle = match[1] as ActorIdentifier;
				const rkey = match[2];

				return {
					type: 'list',
					uri: makeAtUri(didOrHandle, 'app.bsky.graph.list', rkey),
				};
			}
		}
	}
};
