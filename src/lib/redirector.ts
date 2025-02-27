import { isDid, isHandle } from '~/api/types/identity';
import { isRecordKey, isTid } from '~/api/types/rkey';
import { safeUrlParse } from '~/api/utils/strings';

import {
	BSKY_FEED_LINK_RE,
	BSKY_GO_SHORTLINK_RE,
	BSKY_HASHTAG_LINK_RE,
	BSKY_LIST_LINK_RE,
	BSKY_POST_LINK_RE,
	BSKY_PROFILE_LINK_RE,
	BSKY_SEARCH_LINK_RE,
	BSKY_STARTERPACK_LINK_RE,
} from './bsky/url';

export const redirectBskyUrl = (rawUrl: string): string | null | undefined => {
	const url = safeUrlParse(rawUrl);
	if (!url) {
		return;
	}

	const host = url.host;
	const pathname = url.pathname;
	let match: RegExpExecArray | null | undefined;

	if (host === 'bsky.app' || host === 'staging.bsky.app' || host === 'main.bsky.dev') {
		if ((match = BSKY_PROFILE_LINK_RE.exec(pathname))) {
			const [, actor] = match;

			if (!isHandle(actor) && !isDid(actor)) {
				return null;
			}

			return `/${match[1]}`;
		}

		if ((match = BSKY_POST_LINK_RE.exec(pathname))) {
			const [, actor, rkey] = match;

			if (!isHandle(actor) && !isDid(actor)) {
				return null;
			}
			if (!isTid(rkey)) {
				return null;
			}

			return `/${actor}/${rkey}`;
		}

		if ((match = BSKY_FEED_LINK_RE.exec(pathname))) {
			const [, actor, rkey] = match;

			if (!isHandle(actor) && !isDid(actor)) {
				return null;
			}
			if (!isRecordKey(rkey)) {
				return null;
			}

			return `/${actor}/feeds/${rkey}`;
		}

		if ((match = BSKY_LIST_LINK_RE.exec(pathname))) {
			const [, actor, rkey] = match;

			if (!isHandle(actor) && !isDid(actor)) {
				return null;
			}
			if (!isRecordKey(rkey)) {
				return null;
			}

			return `/${actor}/lists/${rkey}`;
		}

		if ((match = BSKY_STARTERPACK_LINK_RE.exec(pathname))) {
			const [, _page, actor, rkey] = match;

			if (!isHandle(actor) && !isDid(actor)) {
				return null;
			}
			if (!isRecordKey(rkey)) {
				return null;
			}

			return `/${actor}/packs/${rkey}`;
		}

		if ((match = BSKY_SEARCH_LINK_RE.exec(pathname))) {
			const query = url.searchParams.get('q');

			if (!query) {
				return null;
			}

			return `/search?q=${encodeURIComponent(query)}`;
		}

		if ((match = BSKY_HASHTAG_LINK_RE.exec(pathname))) {
			const [, tag] = match;

			return `/search?q=${encodeURIComponent('#' + tag)}`;
		}

		return null;
	}

	if (host === 'go.bsky.app') {
		if ((match = BSKY_GO_SHORTLINK_RE.exec(pathname))) {
			const [, id] = match;

			return `/go/${id}`;
		}
	}

	return;
};
