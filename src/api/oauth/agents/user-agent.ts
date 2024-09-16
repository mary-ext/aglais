import type { FetchHandlerObject } from '@atcute/client';

import { createDPoPFetch } from '../dpop';
import { CLIENT_ID } from '../env';
import type { GetCachedOptions } from '../store/getter';
import type { Session } from '../types/token';

import { OAuthServerAgent } from './server-agent';
import { sessions } from './sessions';

export class OAuthUserAgent implements FetchHandlerObject {
	#fetch: typeof fetch;
	#getSessionPromise: Promise<void> | undefined;

	constructor(public session: Session) {
		this.#fetch = createDPoPFetch(CLIENT_ID, session.dpopKey, false);
	}

	#getSession(options?: GetCachedOptions): Promise<Session> {
		const promise = sessions.get(this.session.info.sub, options);

		this.#getSessionPromise = promise
			.then((session): void => {
				this.session = session;
			})
			.finally(() => {
				this.#getSessionPromise = undefined;
			});

		return promise;
	}

	async signOut(): Promise<void> {
		const sub = this.session.info.sub;

		try {
			const { dpopKey, info, token } = await sessions.get(sub, { allowStale: true });
			const server = new OAuthServerAgent(info.server, dpopKey);

			await server.revoke(token.refresh ?? token.access);
		} finally {
			await sessions.deleteStored(sub);
		}
	}

	async handle(pathname: string, init?: RequestInit): Promise<Response> {
		const headers = new Headers(init?.headers);

		let session = this.session;

		let url = new URL(pathname, session.info.aud);
		headers.set('authorization', `${session.token.type} ${session.token.access}`);

		let response = await this.#fetch(url, { ...init, headers });
		if (!isInvalidTokenResponse(response)) {
			return response;
		}

		try {
			// CachedGetter doesn't deduplicate requests if they throw, we kinda want
			// them to throw, so here's an attempt at waiting for existing requests
			// to see if they'll throw or not.
			while (this.#getSessionPromise) {
				await this.#getSessionPromise;
			}

			// Refresh the token normally first, it could just be that we're behind
			const newSession = await this.#getSession();

			if (newSession.token.expires_at === session.token.expires_at) {
				// If it returns the same expiry then we need to force it
				session = await this.#getSession({ noCache: true });
			} else {
				session = newSession;
			}
		} catch {
			return response;
		}

		// Stream already consumed, can't retry.
		if (init?.body instanceof ReadableStream) {
			return response;
		}

		url = new URL(pathname, session.info.aud);
		headers.set('authorization', `${session.token.type} ${session.token.access}`);

		return await this.#fetch(url, { ...init, headers });
	}
}

const isInvalidTokenResponse = (response: Response) => {
	if (response.status !== 401) {
		return false;
	}

	const auth = response.headers.get('www-authenticate');

	return (
		auth != null &&
		(auth.startsWith('Bearer ') || auth.startsWith('DPoP ')) &&
		auth.includes('error="invalid_token"')
	);
};
