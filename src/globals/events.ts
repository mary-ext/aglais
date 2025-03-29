import { EventEmitter } from '@mary/events';

export const globalEvents = new EventEmitter<{
	// User has published a post
	postpublished: [];
	// Media is being played
	mediaplay: [id: string];
	// User initiated scroll to top
	softreset: [];
}>();
