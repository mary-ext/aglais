import type { At } from '@atcute/client/lexicons';

export interface ResolvedIdentity {
	id: At.DID;
	pds: URL;
}
