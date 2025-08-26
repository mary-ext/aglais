import { ComAtprotoIdentityResolveDid, ComAtprotoIdentityResolveHandle } from '@atcute/atproto';
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
import { InvalidRequestError, XRPCRouter, json } from '@atcute/xrpc-server';

const handleResolver = new CompositeHandleResolver({
	methods: {
		dns: new DohJsonHandleResolver({ dohUrl: 'https://mozilla.cloudflare-dns.com/dns-query' }),
		http: new WellKnownHandleResolver(),
	},
});

const didDocResolver = new CompositeDidDocumentResolver<string>({
	methods: {
		plc: new PlcDidDocumentResolver(),
		web: new WebDidDocumentResolver(),
	},
});

const router = new XRPCRouter();

router.add(ComAtprotoIdentityResolveHandle.mainSchema, {
	async handler({ params: { handle } }) {
		try {
			const did = await handleResolver.resolve(handle);

			return json({ did }, { headers: { 'cache-control': 'public, max-age=600' } });
		} catch (err) {
			console.error(`resolveHandleToDid`, handle, err);

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
	},
});

router.add(ComAtprotoIdentityResolveDid.mainSchema, {
	async handler({ params: { did } }) {
		try {
			const doc = await didDocResolver.resolve(did);

			return json(
				{ didDoc: doc as unknown as Record<string, unknown> },
				{ headers: { 'cache-control': 'public, max-age=3600' } },
			);
		} catch (err) {
			console.error(`resolveDidToDoc`, did, err);

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
	},
});

export default { fetch: router.fetch } satisfies ExportedHandler<Env>;
