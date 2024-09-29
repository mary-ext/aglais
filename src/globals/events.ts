import { EventEmitter } from '@mary/events';

export const globalEvents = new EventEmitter<{
	// User has published a post
	postpublished(): void;
	// Media is being played
	mediaplay(id: string): void;
}>();
