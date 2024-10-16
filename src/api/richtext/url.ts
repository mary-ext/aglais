import { safeUrlParse } from '../utils/strings';

const TRIM_HOST_RE = /^www\./;
const TRIM_URLTEXT_RE = /^\s*(https?:\/\/)?(?:www\.)?/;
const PATH_MAX_LENGTH = 16;

export const toShortUrl = (href: string): string => {
	const url = safeUrlParse(href);

	if (url !== null) {
		const host =
			(url.username ? url.username + (url.password ? ':' + url.password : '') + '@' : '') +
			url.host.replace(TRIM_HOST_RE, '');

		const path =
			(url.pathname === '/' ? '' : url.pathname) +
			(url.search.length > 1 ? url.search : '') +
			(url.hash.length > 1 ? url.hash : '');

		if (path.length > PATH_MAX_LENGTH) {
			return host + path.slice(0, PATH_MAX_LENGTH - 1) + '…';
		}

		return host + path;
	}

	return href;
};

export const isLinkValid = (uri: string, text: string) => {
	const url = safeUrlParse(uri);

	if (!url) {
		return false;
	}

	const expectedHost = buildHostPart(url);
	const length = expectedHost.length;

	const normalized = text.replace(TRIM_URLTEXT_RE, '').toLowerCase();
	const normalizedLength = normalized.length;

	const boundary = normalizedLength >= length ? normalized[length] : undefined;

	return (
		(!boundary || boundary === '/' || boundary === '?' || boundary === '#') &&
		normalized.startsWith(expectedHost)
	);
};

const buildHostPart = (url: URL) => {
	const username = url.username;
	// const password = url.password;

	const hostname = url.hostname.replace(TRIM_HOST_RE, '').toLowerCase();
	const port = url.port;

	// const auth = username ? username + (password ? ':' + password : '') + '@' : '';

	// Perhaps might be best if we always warn on authentication being passed.
	const auth = username ? '\0@@\0' : '';
	const host = hostname + (port ? ':' + port : '');

	return auth + host;
};
