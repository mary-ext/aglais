import type { At } from '@atcute/client/lexicons';

import { OAuthResponseError, TokenRefreshError } from '../errors';
import { database } from '../globals';
import { getMetadataFromAuthorizationServer } from '../resolver';
import { CachedGetter } from '../store/getter';
import type { DPoPKey } from '../types/dpop';
import type { TokenSet } from '../types/token';

import { OAuthServerAgent } from './server-agent';

export interface Session {
	dpopKey: DPoPKey;
	tokenSet: TokenSet;
}

export const sessions = new CachedGetter<At.DID, Session>(
	async (sub, options, storedSession): Promise<Session> => {
		if (storedSession === undefined) {
			throw new TokenRefreshError(sub, `session deleted by another tab`);
		}

		const { dpopKey, tokenSet } = storedSession;

		const metadata = await getMetadataFromAuthorizationServer(tokenSet.iss, { signal: options?.signal });
		const server = new OAuthServerAgent(metadata, dpopKey);

		try {
			const newTokenSet = await server.refresh(tokenSet);

			return { dpopKey, tokenSet: newTokenSet };
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
		isStale(_sub, { tokenSet }) {
			// Add some lee way to ensure the token is not expired when it
			// reaches the server.
			return tokenSet.expires_at != null && tokenSet.expires_at < Date.now() + 60e3;
		},
		async onStoreError(err, _sub, { tokenSet, dpopKey }) {
			// If the token data cannot be stored, let's revoke it
			const metadata = await getMetadataFromAuthorizationServer(tokenSet.iss);
			const server = new OAuthServerAgent(metadata, dpopKey);

			await server.revoke(tokenSet.refresh_token ?? tokenSet.access_token);
			throw err;
		},
	},
);

export const getSession = (sub: At.DID, refresh?: boolean) => {
	return sessions.get(sub, { noCache: refresh === true, allowStale: refresh === false });
};
