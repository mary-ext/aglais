import type { At } from '@atcute/client/lexicons';

export interface OAuthTokenResponse {
	access_token: string;
	// Can be DPoP or Bearer, normalize casing.
	token_type: string;
	issuer?: string;
	sub?: string;
	scope?: string;
	id_token?: `${string}.${string}.${string}`;
	refresh_token?: string;
	expires_in?: number;
	authorization_details?:
		| {
				type: string;
				locations?: string[];
				actions?: string[];
				datatypes?: string[];
				identifier?: string;
				privileges?: string[];
		  }[]
		| undefined;
}

export interface TokenSet {
	sub: At.DID;
	iss: string;
	aud: string;
	scope?: string;

	id_token?: `${string}.${string}.${string}`;
	refresh_token?: string;
	access_token: string;
	token_type: string;
	/** ISO Date */
	expires_at?: number;
}
