import type { AppBskyFeedPostgate, AppBskyFeedThreadgate } from '@atcute/bluesky';

import type { PersistedPostgate, PersistedThreadgate } from '../account';

export type ThreadgateState = Pick<AppBskyFeedThreadgate.Main, 'allow' | 'hiddenReplies'>;
export type PostgateState = Pick<AppBskyFeedPostgate.Main, 'detachedEmbeddingUris' | 'embeddingRules'>;

export const toPersistedThreadgate = (gate: ThreadgateState): PersistedThreadgate => {
	return {
		allow: gate.allow?.map((rule) => {
			switch (rule.$type) {
				case 'app.bsky.feed.threadgate#followingRule':
					return { type: 'following' };
				case 'app.bsky.feed.threadgate#followerRule':
					return { type: 'follower' };
				case 'app.bsky.feed.threadgate#mentionRule':
					return { type: 'mention' };
				case 'app.bsky.feed.threadgate#listRule':
					return { type: 'list', uri: rule.list };
			}
		}),
	};
};

export const fromPersistedThreadgate = (gate: PersistedThreadgate): ThreadgateState => {
	return {
		allow: gate.allow?.map((rule) => {
			switch (rule.type) {
				case 'following':
					return { $type: 'app.bsky.feed.threadgate#followingRule' };
				case 'follower':
					return { $type: 'app.bsky.feed.threadgate#followerRule' };
				case 'mention':
					return { $type: 'app.bsky.feed.threadgate#mentionRule' };
				case 'list':
					return { $type: 'app.bsky.feed.threadgate#listRule', list: rule.uri };
			}
		}),
	};
};

export const toPersistedPostgate = (gate: PostgateState): PersistedPostgate => {
	return {
		embeddingRules: gate.embeddingRules?.map((rule) => {
			switch (rule.$type) {
				case 'app.bsky.feed.postgate#disableRule':
					return { type: 'disable' };
			}
		}),
	};
};

export const fromPersistedPostgate = (gate: PersistedPostgate): PostgateState => {
	return {
		embeddingRules: gate.embeddingRules?.map((rule) => {
			switch (rule.type) {
				case 'disable':
					return { $type: 'app.bsky.feed.postgate#disableRule' };
			}
		}),
	};
};
