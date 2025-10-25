import { type DidDocument, getAtprotoHandle, getPdsEndpoint } from '@atcute/identity';
import {
	AmbiguousHandleError,
	CompositeDidDocumentResolver,
	CompositeHandleResolver,
	DidNotFoundError,
	DocumentNotFoundError,
	DohJsonHandleResolver,
	ImproperDidError,
	InvalidResolvedHandleError,
	PlcDidDocumentResolver,
	UnsupportedDidMethodError,
	WebDidDocumentResolver,
	WellKnownHandleResolver,
} from '@atcute/identity-resolver';
import { type Did, type Handle, type ResourceUri, isDid } from '@atcute/lexicons/syntax';
import { AuthRequiredError, InvalidRequestError, XRPCRouter, json } from '@atcute/xrpc-server';

import * as jwks from '../oauth-credentials.local.json' with { type: 'json' };

import { InvalidDPoPError, createClientAssertion, verifyDPoP } from './jwt';
import { requestAssertionSchema, resolveIdentitySchema } from './lexicons';

const privateKeyId = jwks.keys[0].privateKey.kid;
const privateKey = await crypto.subtle.importKey(
	'jwk',
	jwks.keys[0].privateKey,
	{ name: 'ECDSA', namedCurve: 'P-256' },
	false,
	['sign'],
);

const handleResolver = new CompositeHandleResolver({
	methods: {
		dns: new DohJsonHandleResolver({ dohUrl: 'https://mozilla.cloudflare-dns.com/dns-query' }),
		http: new WellKnownHandleResolver(),
	},
});

const didDocumentResolver = new CompositeDidDocumentResolver<string>({
	methods: {
		plc: new PlcDidDocumentResolver(),
		web: new WebDidDocumentResolver(),
	},
});

const cache = caches.default;
const contexts = new WeakMap<Request, ExecutionContext>();

const router = new XRPCRouter({
	middlewares: [
		async (request, next) => {
			if (request.method !== 'GET') {
				return await next(request);
			}

			let response = await cache.match(request);
			if (response === undefined) {
				response = await next(request);

				if (response.status === 200 && response.headers.has('cache-control')) {
					const ctx = contexts.get(request);
					if (ctx) {
						ctx.waitUntil(cache.put(request, response.clone()));
					} else {
						await cache.put(request, response.clone());
					}
				}
			}

			return response;
		},
	],
});

router.addProcedure(requestAssertionSchema, {
	async handler({ input: { jkt, aud }, request }) {
		const url = new URL(request.url);

		const origin = request.headers.get('origin');
		if (origin !== url.origin) {
			throw new AuthRequiredError({ description: 'invalid origin' });
		}

		const dpop = request.headers.get('dpop');
		try {
			await verifyDPoP(dpop, jkt);
		} catch (err) {
			if (err instanceof InvalidDPoPError) {
				throw new AuthRequiredError({ description: err.message });
			}

			throw err;
		}

		const assertion = await createClientAssertion({
			privateKey: privateKey,

			client_id: `https://${url.host}/oauth-client-metadata.json`,
			kid: privateKeyId,
			aud: aud,
		});

		return json({
			assertion: assertion,
		});
	},
});

router.addQuery(resolveIdentitySchema, {
	async handler({ params: { identifier } }) {
		const identifierIsDid = isDid(identifier);

		let did: Did;
		if (identifierIsDid) {
			did = identifier;
		} else {
			try {
				did = await handleResolver.resolve(identifier);
			} catch (err) {
				if (err instanceof DidNotFoundError) {
					throw new InvalidRequestError({ description: `no did found under that handle` });
				}

				if (err instanceof InvalidResolvedHandleError) {
					throw new InvalidRequestError({ description: `did found but is invalid atproto did` });
				}

				if (err instanceof AmbiguousHandleError) {
					throw new InvalidRequestError({ description: `multiple did found under that handle` });
				}

				throw err;
			}
		}

		let doc: DidDocument;
		try {
			doc = await didDocumentResolver.resolve(did);
		} catch (err) {
			if (err instanceof DocumentNotFoundError) {
				throw new InvalidRequestError({ description: `no document found under that did` });
			}

			if (err instanceof UnsupportedDidMethodError) {
				throw new InvalidRequestError({ description: `unsupported did method` });
			}

			if (err instanceof ImproperDidError) {
				throw new InvalidRequestError({ description: `invalid did` });
			}

			throw err;
		}

		const pds = getPdsEndpoint(doc);
		if (!pds) {
			throw new InvalidRequestError({ description: `missing pds endpoint` });
		}

		let handle: Handle = 'handle.invalid';
		if (identifierIsDid) {
			const writtenHandle = getAtprotoHandle(doc);
			if (writtenHandle) {
				try {
					const resolved = await handleResolver.resolve(writtenHandle);

					if (resolved === did) {
						handle = writtenHandle;
					}
				} catch {}
			}
		} else if (getAtprotoHandle(doc) === identifier) {
			handle = identifier;
		}

		return json({
			did: did,
			handle: handle,
			pds: new URL(pds).href as ResourceUri,
		});
	},
});

export default {
	fetch(request, _env, ctx) {
		const url = new URL(request.url);

		if (url.pathname === '/oauth-client-metadata.json') {
			return Response.json({
				client_id: `https://${url.host}/oauth-client-metadata.json`,
				client_uri: `https://${url.host}`,
				client_name: import.meta.env.VITE_APP_NAME,
				application_type: 'web',
				scope: 'atproto transition:generic transition:chat.bsky',
				grant_types: ['authorization_code', 'refresh_token'],
				redirect_uris: [`https://${url.host}/oauth/callback`],
				response_types: ['code'],
				token_endpoint_auth_method: 'private_key_jwt',
				token_endpoint_auth_signing_alg: 'ES256',
				jwks_uri: `https://${url.host}/oauth-jwks.json`,
				dpop_bound_access_tokens: true,
			});
		}

		if (url.pathname === '/oauth-jwks.json') {
			return Response.json({
				keys: jwks.keys.map((key) => key.publicKey),
			});
		}

		contexts.set(request, ctx);
		return router.fetch(request);
	},
} satisfies ExportedHandler<Env>;
