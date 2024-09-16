export const replaceVideoCdnUrl = (url: string) => {
	// Redirect all files directly to the CDN, skipping the watch time/retention tracking
	//
	// Worth noting, I don't think `session_id` is tied to your account in any way, this is
	// mostly an effort to get videos to load faster since this player is lazily-loaded
	return url.replace('https://video.bsky.app/watch/', 'https://video.cdn.bsky.app/hls/');
};
