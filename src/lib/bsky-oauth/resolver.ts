import type { At, ComAtprotoIdentityResolveHandle } from '@atcute/client/lexicons';
import { getPdsEndpoint, type DidDocument } from '@atcute/client/utils/did';

import { isDid } from '~/api/utils/strings';

import { database } from './globals';
import { CachedGetter, type GetCachedOptions } from './store/getter';
import type { AuthorizationServerMetadata, ProtectedResourceMetadata } from './types/server';
import { extractContentType } from './utils';
import type { ResolvedIdentity } from './types/identity';

const DID_WEB_RE =
	/^([a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*(?:\.[a-zA-Z]{2,}))((?::[a-zA-Z0-9._%-]*[a-zA-Z0-9._-])*)$/;

export const handleResolver = new CachedGetter(async (handle: string, options): Promise<At.DID> => {
	const url = `https://api.bsky.app` + `/xrpc/com.atproto.identity.resolveHandle` + `?handle=${handle}`;

	const response = await fetch(url, { signal: options?.signal });
	if (!response.ok) {
		throw new ResolverError(`got http ${response.status}`);
	}

	const json = (await response.json()) as ComAtprotoIdentityResolveHandle.Output;
	return json.did;
}, database.handles);

export const identityResolver = new CachedGetter(async (did: At.DID, options): Promise<DidDocument> => {
	const init: RequestInit = { signal: options?.signal };

	const colon_index = did.indexOf(':', 4);

	const type = did.slice(4, colon_index);
	const ident = did.slice(colon_index + 1);

	// 2. retrieve their DID documents
	let doc: DidDocument;

	if (type === 'plc') {
		const response = await fetch(`https://plc.directory/${did}`, init);

		if (response.status === 404) {
			throw new ResolverError('plc_not_found');
		} else if (!response.ok) {
			throw new ResolverError('plc_unreachable');
		}

		const json = await response.json();

		doc = json as DidDocument;
	} else if (type === 'web') {
		const match = DID_WEB_RE.exec(ident);
		if (!match) {
			throw new ResolverError('web_invalid');
		}

		const [, host, raw_path] = match;
		const path = raw_path ? raw_path.replaceAll(':', '/') : `/.well-known`;

		const response = await fetch(`https://${host}${path}/did.json`, init);

		if (response.status === 404) {
			throw new ResolverError('web_not_found');
		} else if (!response.ok) {
			throw new ResolverError('web_unreachable');
		}

		const json = await response.json();

		doc = json as DidDocument;
	} else {
		throw new ResolverError('did_unsupported');
	}

	return doc;
}, database.didDocuments);

export const protectedResourceMetadataResolver = new CachedGetter(
	async (host: string, options): Promise<ProtectedResourceMetadata> => {
		const url = new URL(`/.well-known/oauth-protected-resource`, host);
		const response = await fetch(url, {
			signal: options?.signal,
			redirect: 'manual',
			headers: {
				accept: 'application/json',
			},
		});

		if (response.status !== 200) {
			throw new ResolverError(`unexpected status code; got ${response.status}`);
		}

		if (extractContentType(response.headers) !== 'application/json') {
			throw new ResolverError(`unexpected content-type`);
		}

		const metadata = (await response.json()) as ProtectedResourceMetadata;
		if (metadata.resource !== url.origin) {
			throw new ResolverError(`unexpected issuer; got ${metadata.resource}`);
		}

		return metadata;
	},
	database.protectedServerMetadata,
);

export const authorizationServerMetadataResolver = new CachedGetter(
	async (host: string, options): Promise<AuthorizationServerMetadata> => {
		const url = new URL(`/.well-known/oauth-authorization-server`, host);
		const response = await fetch(url, {
			signal: options?.signal,
			redirect: 'manual',
			headers: {
				accept: 'application/json',
			},
		});

		if (response.status !== 200) {
			throw new ResolverError(`unexpected status code; got ${response.status}`);
		}

		if (extractContentType(response.headers) !== 'application/json') {
			throw new ResolverError(`unexpected content-type`);
		}

		const metadata = (await response.json()) as AuthorizationServerMetadata;
		if (metadata.issuer !== url.origin) {
			throw new ResolverError(`unexpected issuer; got ${metadata.issuer}`);
		}
		if (!metadata.client_id_metadata_document_supported) {
			throw new ResolverError(`authorization server does not support 'client_id_metadata_document'`);
		}
		if (metadata.require_pushed_authorization_requests && !metadata.pushed_authorization_request_endpoint) {
			throw new ResolverError(`authorization server requires PAR but no endpoint is specified`);
		}
		if (metadata.response_types_supported) {
			if (!metadata.response_types_supported.includes('code')) {
				throw new ResolverError(`authorization server does not support 'code' response type`);
			}
		}

		return metadata;
	},
	database.authorizationServerMetadata,
);

export const resolveFromIdentity = async (
	identifier: string,
	options?: GetCachedOptions,
): Promise<{ identity: ResolvedIdentity; metadata: AuthorizationServerMetadata }> => {
	let did: At.DID;
	if (isDid(identifier)) {
		did = identifier;
	} else {
		const resolved = await handleResolver.get(identifier, options);
		did = resolved;
	}

	const doc = await identityResolver.get(did, options);
	const pds = getPdsEndpoint(doc);

	if (!pds) {
		throw new ResolverError(`missing pds endpoint from ${identifier}`);
	}

	return {
		identity: {
			id: did,
			pds: new URL(pds),
		},
		metadata: await getMetadataFromResourceServer(pds),
	};
};

export const resolveFromService = async (
	input: string,
	options?: GetCachedOptions,
): Promise<{ metadata: AuthorizationServerMetadata }> => {
	try {
		const metadata = await getMetadataFromResourceServer(input, options);
		return { metadata };
	} catch (err) {
		if (err instanceof ResolverError) {
			try {
				const metadata = await getMetadataFromAuthorizationServer(input, options);
				return { metadata };
			} catch {}
		}

		throw err;
	}
};

export const getMetadataFromResourceServer = async (input: string, options?: GetCachedOptions) => {
	const rs_metadata = await protectedResourceMetadataResolver.get(input, options);

	if (rs_metadata.authorization_servers?.length !== 1) {
		throw new ResolverError(
			`expected exactly one authorization server; got ${rs_metadata.authorization_servers?.length ?? 0}`,
		);
	}

	const issuer = rs_metadata.authorization_servers[0];

	const as_metadata = await getMetadataFromAuthorizationServer(issuer);

	if (as_metadata.protected_resources) {
		if (!as_metadata.protected_resources.includes(rs_metadata.resource)) {
			throw new ResolverError(`pds is not in authorization server's protected list`);
		}
	}

	return as_metadata;
};

export const getMetadataFromAuthorizationServer = (input: string, options?: GetCachedOptions) => {
	return authorizationServerMetadataResolver.get(input, options);
};

export class ResolverError extends Error {
	name = 'ResolverError';
}
