import { EventEmitter } from '@mary/events';

export const globalEvents = new EventEmitter<{
	// Current session has expired
	sessionexpired(): void;
	// User has published a post
	postpublished(): void;
	// User tried navigating to the same main page they're already in
	softreset(): void;

	// Media is being played
	mediaplay(id: string): void;
}>();
