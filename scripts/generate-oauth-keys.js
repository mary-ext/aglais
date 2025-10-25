import * as fs from 'node:fs/promises';

import * as v from '@badrap/valita';

import * as TID from '@atcute/tid';

const jwksSchema = v.object({
	keys: v.array(
		v.object({
			privateKey: v.unknown(),
			publicKey: v.unknown(),
		}),
	),
});

/** @type {v.Infer<typeof jwksSchema> | undefined} */
let jwks;
try {
	const raw = await fs.readFile('./oauth-credentials.local.json', 'utf-8');
	const json = JSON.parse(raw);

	jwks = jwksSchema.parse(json, { mode: 'passthrough' });
} catch (err) {
	if (err.code !== 'ENOENT') {
		throw err;
	}

	jwks = {
		keys: [],
	};
}

const { publicKey, privateKey } = await crypto.subtle.generateKey(
	{
		name: 'ECDSA',
		namedCurve: 'P-256',
	},
	true,
	['sign', 'verify'],
);

const kid = `aglais-${TID.now()}`;
const privateJWK = await crypto.subtle.exportKey('jwk', privateKey);
const publicJWK = await crypto.subtle.exportKey('jwk', publicKey);

jwks = {
	keys: [
		{
			privateKey: {
				...privateJWK,
				kid: kid,
			},
			publicKey: {
				kty: publicJWK.kty,
				crv: publicJWK.crv,
				x: publicJWK.x,
				y: publicJWK.y,
				use: 'sig',
				alg: 'ES256',
				kid: kid,
			},
		},
		...jwks.keys,
	],
};

await fs.writeFile('./oauth-credentials.local.json', JSON.stringify(jwks, null, '\t') + '\n');
