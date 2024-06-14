import { BskyXRPC, getPdsEndpoint, type DidDocument } from '@mary/bluesky-client';
import type { At } from '@mary/bluesky-client/lexicons';

import { DEFAULT_APP_VIEW } from '../defaults';
import type { DataServer } from '../types';
import { isDid } from './strings';

const HOST_RE = /^([a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*(?:\.[a-zA-Z]+))$/;

export type ResolutionErrorKind =
	| 'DID_UNSUPPORTED'
	| 'PLC_NOT_FOUND'
	| 'PLC_UNREACHABLE'
	| 'WEB_INVALID'
	| 'WEB_NOT_FOUND'
	| 'WEB_UNREACHABLE';

export class DidResolutionError extends Error {
	message!: ResolutionErrorKind;

	constructor(kind: ResolutionErrorKind) {
		super(kind);
	}
}

export const findDidDocument = async (identifier: string): Promise<DidDocument> => {
	let did: At.DID;

	if (isDid(identifier)) {
		did = identifier;
	} else {
		const rpc = new BskyXRPC({ service: DEFAULT_APP_VIEW });
		const response = await rpc.get('com.atproto.identity.resolveHandle', {
			params: {
				handle: identifier,
			},
		});

		did = response.data.did;
	}

	const colon_index = did.indexOf(':', 4);

	const type = did.slice(4, colon_index);
	const ident = did.slice(colon_index + 1);

	// 2. retrieve their DID documents
	let doc: DidDocument;

	if (type === 'plc') {
		const response = await fetch(`https://plc.directory/${did}`);

		if (response.status === 404) {
			throw new DidResolutionError('PLC_NOT_FOUND');
		} else if (!response.ok) {
			throw new DidResolutionError('PLC_UNREACHABLE');
		}

		const json = await response.json();

		doc = json as DidDocument;
	} else if (type === 'web') {
		if (!HOST_RE.test(ident)) {
			throw new DidResolutionError('WEB_INVALID');
		}

		const response = await fetch(`https://${ident}/.well-known/did.json`);

		if (response.status === 404) {
			throw new DidResolutionError('WEB_NOT_FOUND');
		} else if (!response.ok) {
			throw new DidResolutionError('WEB_UNREACHABLE');
		}

		const json = await response.json();

		doc = json as DidDocument;
	} else {
		throw new DidResolutionError('DID_UNSUPPORTED');
	}

	return doc;
};

export const getDataServer = (doc: DidDocument): DataServer | null => {
	const pds = getPdsEndpoint(doc);

	if (pds) {
		// Check if this is bsky.social, and give it a nice name.
		const url = new URL(pds);
		const host = url.host;

		const isBskySocial = host === 'bsky.social' || host.endsWith('.host.bsky.network');

		return {
			name: isBskySocial ? `Bluesky Social` : host,
			uri: pds,
		};
	}

	return null;
};
