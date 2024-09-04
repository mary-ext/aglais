import type { At } from '@atcute/client/lexicons';

import { assert } from '~/lib/utils/invariant';

export const isDid = (value: string): value is At.DID => {
	return value.startsWith('did:');
};

export const ATURI_RE =
	/^at:\/\/(did:[a-zA-Z0-9._:%-]+|[a-zA-Z0-9-.]+)\/([a-zA-Z0-9-.]+)\/([a-zA-Z0-9._~:@!$&%')(*+,;=-]+)(?:#(\/[a-zA-Z0-9._~:@!$&%')(*+,;=\-[\]/\\]*))?$/;

export const DID_RE = /^did:([a-z]+):([a-zA-Z0-9._:%-]*[a-zA-Z0-9._-])$/;
export const HANDLE_RE = /^[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*(?:\.[a-zA-Z]{2,})$/;

export interface AtUri {
	repo: string;
	collection: string;
	rkey: string;
	fragment: string | undefined;
}

export const parseAtUri = (str: string): AtUri => {
	const match = ATURI_RE.exec(str);
	assert(match !== null, `Failed to parse AT URI for ${str}`);

	return {
		repo: match[1] as At.DID,
		collection: match[2],
		rkey: match[3],
		fragment: match[4],
	};
};

const _parse = URL.parse;

// Check for the existence of URL.parse and use that if available, removes the
// performance hit from try..catch blocks.
export const safeUrlParse = _parse
	? (text: string): URL | null => {
			const url = _parse(text);

			if (url !== null && (url.protocol === 'https:' || url.protocol === 'http:')) {
				return url;
			}

			return null;
		}
	: (text: string): URL | null => {
			try {
				const url = new URL(text);

				if (url.protocol === 'https:' || url.protocol === 'http:') {
					return url;
				}
			} catch {}

			return null;
		};

const TRIM_HOST_RE = /^www\./;
const TRIM_URLTEXT_RE = /^\s*(https?:\/\/)?(?:www\.)?/;
// const PATH_MAX_LENGTH = 18;

export const isLinkValid = (uri: string, text: string) => {
	const url = safeUrlParse(uri);

	if (url === null) {
		return false;
	}

	const expectedHost = buildHostPart(url);
	const length = expectedHost.length;

	const normalized = text.replace(TRIM_URLTEXT_RE, '').toLowerCase();
	const normalizedLength = normalized.length;

	const boundary = normalizedLength >= length ? normalized[length] : undefined;

	return (
		(boundary === undefined || boundary === '/' || boundary === '?' || boundary === '#') &&
		normalized.startsWith(expectedHost)
	);
};

const buildHostPart = (url: URL) => {
	const username = url.username;
	// const password = url.password;

	const hostname = url.hostname.replace(TRIM_HOST_RE, '').toLowerCase();
	const port = url.port;

	// Perhaps might be best if we always warn on authentication being passed.
	// const auth = username ? username + (password ? ':' + password : '') + '@' : '';
	const auth = username ? '\0@@\0' : '';

	const host = hostname + (port ? ':' + port : '');

	return auth + host;
};
