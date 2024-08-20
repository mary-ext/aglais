export const getCdnUrl = (did: string, cid: string, format: 'png' | 'jpeg' | 'webp' = 'webp') => {
	return `https://cdn.bsky.app/img/avatar_thumbnail/plain/${did}/${cid}@${format}`;
};
