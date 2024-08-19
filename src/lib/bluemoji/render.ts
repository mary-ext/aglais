import type { At } from '@atcute/client/lexicons';

export const getCdnUrl = (did: At.DID, cid: string, format: 'png' | 'jpeg' | 'webp' = 'webp') => {
	return `https://cdn.bsky.app/img/avatar_thumbnail/plain/${did}/${cid}@${format}`;
};
