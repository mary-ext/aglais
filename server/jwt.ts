import * as v from '@badrap/valita';

import { fromBase64Url, toBase64Url } from '@atcute/multibase';
import { decodeUtf8From, encodeUtf8 } from '@atcute/uint8array';

export class MalformedJwtError extends Error {
	name = 'MalformedJwtError';

	constructor(options?: ErrorOptions) {
		super(`malformed JWT`, options);
	}
}

export interface DecodedJwt<THeader, TPayload> {
	header: THeader;
	payload: TPayload;
	message: Uint8Array<ArrayBuffer>;
	signature: Uint8Array<ArrayBuffer>;
}

const decodeJwt = <THeader, TPayload>(
	input: string,
	schemas: { header: v.Type<THeader>; payload: v.Type<TPayload> },
): DecodedJwt<THeader, TPayload> => {
	const parts = input.split('.');
	if (parts.length !== 3) {
		throw new MalformedJwtError();
	}

	const [headerString, payloadString, signatureString] = parts;

	const header = decodeJwtPortion(schemas.header, headerString);
	const payload = decodeJwtPortion(schemas.payload, payloadString);
	const signature = decodeJwtSignature(signatureString);

	return {
		header: header,
		payload: payload,
		message: encodeUtf8(`${headerString}.${payloadString}`),
		signature: signature,
	};
};

const decodeJwtPortion = <T>(schema: v.Type<T>, input: string): T => {
	try {
		const raw = decodeUtf8From(fromBase64Url(input));
		const json = JSON.parse(raw);

		return schema.parse(json, { mode: 'passthrough' });
	} catch (err) {
		throw new MalformedJwtError({ cause: err });
	}
};

const decodeJwtSignature = (input: string): Uint8Array<ArrayBuffer> => {
	try {
		return fromBase64Url(input);
	} catch (err) {
		throw new MalformedJwtError({ cause: err });
	}
};

const encodeJwtPortion = (data: unknown): string => {
	return toBase64Url(encodeUtf8(JSON.stringify(data)));
};

const encodeJwtSignature = (data: Uint8Array): string => {
	return toBase64Url(data);
};

// #region DPoP
export class InvalidDPoPError extends Error {
	name = 'InvalidDPoPError';
}

const dpopHeaderSchema = v.object({
	typ: v.literal('dpop+jwt'),
	alg: v.literal('ES256'),
	jwk: v.object({
		kty: v.literal('EC'),
		crv: v.literal('P-256'),
		x: v.string(),
		y: v.string(),
	}),
});

const dpopPayloadSchema = v.object({
	htm: v.string(),
	htu: v.string(),
	iat: v.number(),
	jti: v.string(),
});

const calculateJwkThumbprint = async (jwk: JsonWebKey): Promise<string> => {
	// For EC keys, thumbprint is SHA-256 of canonical JSON
	// Members must be in lexicographic order
	const canonical = JSON.stringify({
		crv: jwk.crv,
		kty: jwk.kty,
		x: jwk.x,
		y: jwk.y,
	});

	const hash = await crypto.subtle.digest('SHA-256', encodeUtf8(canonical));
	return toBase64Url(new Uint8Array(hash));
};

export const verifyDPoP = async (dpop: string | null, jkt: string): Promise<void> => {
	if (!dpop) {
		throw new InvalidDPoPError(`missing DPoP header`);
	}

	// Decode the DPoP JWT
	let decoded;
	try {
		decoded = decodeJwt(dpop, {
			header: dpopHeaderSchema,
			payload: dpopPayloadSchema,
		});
	} catch (err) {
		throw new InvalidDPoPError(`malformed JWT`, { cause: err });
	}

	const { header, message, signature } = decoded;

	// Verify JWK thumbprint matches jkt
	const thumbprint = await calculateJwkThumbprint(header.jwk);
	if (thumbprint !== jkt) {
		throw new InvalidDPoPError(`JWK thumbprint mismatch`);
	}

	// Import the public key for signature verification
	let publicKey: CryptoKey;
	try {
		publicKey = await crypto.subtle.importKey(
			'jwk',
			header.jwk,
			{ name: 'ECDSA', namedCurve: 'P-256' },
			false,
			['verify'],
		);
	} catch (err) {
		throw new InvalidDPoPError(`failed to import JWK`, { cause: err });
	}

	// Verify the signature
	const isValid = await crypto.subtle.verify(
		{ name: 'ECDSA', hash: 'SHA-256' },
		publicKey,
		signature,
		message,
	);

	if (!isValid) {
		throw new InvalidDPoPError(`invalid DPoP signature`);
	}
};

// #endregion

// #region Client assertions

export const createClientAssertion = async (options: {
	kid: string;
	client_id: string;
	aud: string;
	jkt: string;
	privateKey: CryptoKey;
}): Promise<string> => {
	const { kid, client_id, aud, jkt, privateKey } = options;

	const now = Math.floor(Date.now() / 1000);

	const header = {
		alg: 'ES256',
		typ: 'JWT',
		kid: kid,
	};

	const payload = {
		iss: client_id,
		sub: client_id,
		aud: aud,
		jti: crypto.randomUUID(),
		iat: now,
		exp: now + 60,
		cnf: { jkt },
	};

	const message = `${encodeJwtPortion(header)}.${encodeJwtPortion(payload)}`;

	const signature = encodeJwtSignature(
		new Uint8Array(
			await crypto.subtle.sign(
				{
					name: 'ECDSA',
					hash: 'SHA-256',
				},
				privateKey,
				encodeUtf8(message),
			),
		),
	);

	return `${message}.${signature}`;
};

// #endregion
