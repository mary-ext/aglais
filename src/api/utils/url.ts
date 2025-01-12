import { safeUrlParse } from './strings';

const TRIM_HOST_RE = /^www\./;
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
