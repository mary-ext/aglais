import type { FetchHandlerObject } from '@atcute/client';

import { createDPoPFetch } from '../dpop';
import { CLIENT_ID } from '../env';
import { authorizationServerMetadataResolver } from '../resolver';
import type { DPoPKey } from '../types/dpop';
import type { TokenSet } from '../types/token';

import { OAuthServerAgent } from './server-agent';
import { getSession, sessions } from './session';

export class OAuthUserAgent implements FetchHandlerObject {
	#fetch: typeof fetch;

	constructor(
		public tokenSet: TokenSet,
		public dpopKey: DPoPKey,
	) {
		this.#fetch = createDPoPFetch(CLIENT_ID, dpopKey, false);
	}

	async #getTokenSet(refresh?: boolean) {
		const { tokenSet } = await getSession(this.tokenSet.sub, refresh);
		return (this.tokenSet = tokenSet);
	}

	async signOut(): Promise<void> {
		const sub = this.tokenSet.sub;

		try {
			const { tokenSet, dpopKey } = await getSession(sub, false);

			const metadata = await authorizationServerMetadataResolver.get(tokenSet.iss);
			const server = new OAuthServerAgent(metadata, dpopKey);

			await server.revoke(tokenSet.access_token);
		} finally {
			await sessions.deleteStored(sub);
		}
	}

	async handle(pathname: string, init?: RequestInit): Promise<Response> {
		const headers = new Headers(init?.headers);

		let tokens = this.tokenSet;

		let url = new URL(pathname, tokens.aud);
		headers.set('authorization', `${tokens.token_type} ${tokens.access_token}`);

		let response = await this.#fetch(url, { ...init, headers });
		if (!isInvalidTokenResponse(response)) {
			return response;
		}

		try {
			// Refresh the token normally first, it could just be that we're behind
			const newTokens = await this.#getTokenSet();

			if (newTokens.expires_at === tokens.expires_at) {
				// If it returns the same expiry then we need to force it
				tokens = await this.#getTokenSet(true);
			} else {
				tokens = newTokens;
			}
		} catch {
			return response;
		}

		// Stream already consumed, can't retry.
		if (init?.body instanceof ReadableStream) {
			return response;
		}

		url = new URL(pathname, tokens.aud);
		headers.set('authorization', `${tokens.token_type} ${tokens.access_token}`);

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
