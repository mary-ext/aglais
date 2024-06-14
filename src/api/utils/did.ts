import type { BskyXRPC } from '@mary/bluesky-client';
import type { At } from '@mary/bluesky-client/lexicons';

import { isDid } from './strings';

const getDid = async (rpc: BskyXRPC, actor: string, signal?: AbortSignal) => {
	let did: At.DID;
	if (isDid(actor)) {
		did = actor;
	} else {
		const response = await rpc.get('com.atproto.identity.resolveHandle', {
			signal: signal,
			params: { handle: actor },
		});

		did = response.data.did;
	}

	return did;
};

export default getDid;
