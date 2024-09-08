import type { At } from '@atcute/client/lexicons';

import { createDPoPFetch } from '../dpop';
import { CLIENT_ID, REDIRECT_URI } from '../env';
import { FetchResponseError, OAuthResponseError, TokenRefreshError } from '../errors';
import { resolveFromIdentity } from '../resolver';
import type { DPoPKey } from '../types/dpop';
import type { OAuthParResponse } from '../types/par';
import type { AuthorizationServerMetadata } from '../types/server';
import type { OAuthTokenResponse, TokenSet } from '../types/token';
import { extractContentType } from '../utils';

export class OAuthServerAgent {
	#fetch: typeof fetch;
	#metadata: AuthorizationServerMetadata;

	constructor(metadata: AuthorizationServerMetadata, dpopKey: DPoPKey) {
		this.#metadata = metadata;
		this.#fetch = createDPoPFetch(CLIENT_ID, dpopKey, true);
	}

	async request(
		endpoint: 'pushed_authorization_request',
		payload: Record<string, unknown>,
	): Promise<OAuthParResponse>;
	async request(endpoint: 'token', payload: Record<string, unknown>): Promise<OAuthTokenResponse>;
	async request(endpoint: 'revocation', payload: Record<string, unknown>): Promise<any>;
	async request(endpoint: 'introspection', payload: Record<string, unknown>): Promise<any>;
	async request(endpoint: string, payload: Record<string, unknown>): Promise<any> {
		const url: string | undefined = (this.#metadata as any)[`${endpoint}_endpoint`];
		if (!url) {
			throw new Error(`no endpoint for ${endpoint}`);
		}

		const response = await this.#fetch(url, {
			method: 'post',
			headers: {
				'content-type': 'application/json',
			},
			body: JSON.stringify({
				...payload,
				client_id: CLIENT_ID,
			}),
		});

		if (extractContentType(response.headers) !== 'application/json') {
			throw new FetchResponseError(response, 2, `unexpected content-type`);
		}

		const json = await response.json();

		if (response.ok) {
			return json;
		} else {
			throw new OAuthResponseError(response, json);
		}
	}

	async revoke(token: string): Promise<void> {
		try {
			await this.request('revocation', { token: token });
		} catch {}
	}

	async exchangeCode(code: string, verifier?: string) {
		const response = await this.request('token', {
			grant_type: 'authorization_code',
			redirect_uri: REDIRECT_URI,
			code: code,
			code_verifier: verifier,
		});

		try {
			return await this.#processTokenResponse(response);
		} catch (err) {
			await this.revoke(response.access_token);
			throw err;
		}
	}

	async refresh(tokenSet: TokenSet): Promise<TokenSet> {
		const sub = tokenSet.sub;

		if (!tokenSet.refresh_token) {
			throw new TokenRefreshError(sub, 'No refresh token available');
		}

		const response = await this.request('token', {
			grant_type: 'refresh_token',
			refresh_token: tokenSet.refresh_token,
		});

		try {
			if (sub !== response.sub) {
				throw new TokenRefreshError(sub, `sub mismatch in token response; got ${response.sub}`);
			}
			if (tokenSet.iss !== this.#metadata.issuer) {
				throw new TokenRefreshError(sub, `issuer mismatch; got ${this.#metadata.issuer}`);
			}

			return this.#processTokenResponse(response);
		} catch (err) {
			await this.revoke(response.access_token);

			throw err;
		}
	}

	async #processTokenResponse(response: OAuthTokenResponse): Promise<TokenSet> {
		const sub = response.sub;
		if (!sub) {
			throw new TypeError(`missing sub field in token response`);
		}

		const resolved = await resolveFromIdentity(sub, { signal: AbortSignal.timeout(10e3) });

		if (resolved.metadata.issuer !== this.#metadata.issuer) {
			// Best case scenario; the user switched PDS. Worst case scenario; a bad
			// actor is trying to impersonate a user. In any case, we must not allow
			// this token to be used.
			throw new TypeError(`issuer mismatch; got ${resolved.metadata.issuer}`);
		}

		return {
			sub: sub as At.DID,
			aud: resolved.identity.pds.href,
			iss: resolved.metadata.issuer,

			scope: response.scope,
			id_token: response.id_token,
			refresh_token: response.refresh_token,
			access_token: response.access_token,
			token_type: response.token_type ?? 'Bearer',
			expires_at:
				typeof response.expires_in === 'number' ? Date.now() + response.expires_in * 1000 : undefined,
		};
	}
}
