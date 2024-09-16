import type { At } from '@atcute/client/lexicons';

import { database } from '~/globals/oauth-db';

import { OAuthResponseError, TokenRefreshError } from '../errors';
import { CachedGetter } from '../store/getter';
import type { Session } from '../types/token';

import { OAuthServerAgent } from './server-agent';

export const sessions = new CachedGetter<At.DID, Session>(
	async (sub, _options, storedSession): Promise<Session> => {
		if (storedSession === undefined) {
			throw new TokenRefreshError(sub, `session deleted by another tab`);
		}

		const { dpopKey, info, token } = storedSession;
		const server = new OAuthServerAgent(info.server, dpopKey);

		try {
			const newToken = await server.refresh({ sub: info.sub, token });

			return { dpopKey, info, token: newToken };
		} catch (cause) {
			if (cause instanceof OAuthResponseError && cause.status === 400 && cause.error === 'invalid_grant') {
				throw new TokenRefreshError(sub, `session was revoked`, { cause });
			}

			throw cause;
		}
	},
	database.sessions,
	{
		lockKey(sub) {
			return `oauth-session-${sub}`;
		},
		isStale(_sub, { token }) {
			// Add some lee way to ensure the token is not expired when it
			// reaches the server.
			return token.expires_at != null && token.expires_at < Date.now() + 60e3;
		},
		async onStoreError(err, _sub, { dpopKey, info, token }) {
			// If the token data cannot be stored, let's revoke it
			const server = new OAuthServerAgent(info.server, dpopKey);

			await server.revoke(token.refresh ?? token.access);
			throw err;
		},
	},
);
