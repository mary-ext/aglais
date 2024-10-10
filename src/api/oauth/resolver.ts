import type { At, ComAtprotoIdentityResolveHandle } from '@atcute/client/lexicons';
import { type DidDocument, getPdsEndpoint } from '@atcute/client/utils/did';

import { DEFAULT_APPVIEW_URL } from '~/api/defaults';
import { isDid } from '~/api/utils/strings';

import type { ResolvedIdentity } from './types/identity';
import type { AuthorizationServerMetadata, ProtectedResourceMetadata } from './types/server';
import { extractContentType } from './utils';

const DID_WEB_RE =
	/^([a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*(?:\.[a-zA-Z]{2,}))((?::[a-zA-Z0-9._%-]*[a-zA-Z0-9._-])*)$/;

export const resolveHandle = async (handle: string): Promise<At.DID> => {
	const url = DEFAULT_APPVIEW_URL + `/xrpc/com.atproto.identity.resolveHandle` + `?handle=${handle}`;

	const response = await fetch(url);
	if (!response.ok) {
		throw new ResolverError(`got http ${response.status}`);
	}

	const json = (await response.json()) as ComAtprotoIdentityResolveHandle.Output;
	return json.did;
};

export const resolveDidDocument = async (did: At.DID): Promise<DidDocument> => {
	const colon_index = did.indexOf(':', 4);

	const type = did.slice(4, colon_index);
	const ident = did.slice(colon_index + 1);

	// 2. retrieve their DID documents
	let doc: DidDocument;

	if (type === 'plc') {
		const response = await fetch(`https://plc.directory/${did}`);

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

		const response = await fetch(`https://${host}${path}/did.json`);

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
};

export const resolveProtectedResourceMetadata = async (host: string): Promise<ProtectedResourceMetadata> => {
	const url = new URL(`/.well-known/oauth-protected-resource`, host);
	const response = await fetch(url, {
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
};

export const resolveAuthorizationServerMetadata = async (
	host: string,
): Promise<AuthorizationServerMetadata> => {
	const url = new URL(`/.well-known/oauth-authorization-server`, host);
	const response = await fetch(url, {
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
};

export const resolveFromIdentity = async (
	identifier: string,
): Promise<{ identity: ResolvedIdentity; metadata: AuthorizationServerMetadata }> => {
	let did: At.DID;
	if (isDid(identifier)) {
		did = identifier;
	} else {
		const resolved = await resolveHandle(identifier);
		did = resolved;
	}

	const doc = await resolveDidDocument(did);
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
): Promise<{ metadata: AuthorizationServerMetadata }> => {
	try {
		const metadata = await getMetadataFromResourceServer(input);
		return { metadata };
	} catch (err) {
		if (err instanceof ResolverError) {
			try {
				const metadata = await getMetadataFromAuthorizationServer(input);
				return { metadata };
			} catch {}
		}

		throw err;
	}
};

export const getMetadataFromResourceServer = async (input: string) => {
	const rs_metadata = await resolveProtectedResourceMetadata(input);

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

export const getMetadataFromAuthorizationServer = (input: string) => {
	return resolveAuthorizationServerMetadata(input);
};

export class ResolverError extends Error {
	name = 'ResolverError';
}
