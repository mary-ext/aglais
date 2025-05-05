import { type Client, ok } from '@atcute/client';
import type { At } from '@atcute/client/lexicons';

import { isDid } from '../types/identity';

const getDid = async (client: Client, actor: At.Handle, signal?: AbortSignal) => {
	let did: At.Did;
	if (isDid(actor)) {
		did = actor;
	} else {
		const data = await ok(
			client.get('com.atproto.identity.resolveHandle', {
				signal: signal,
				params: { handle: actor },
			}),
		);

		did = data.did;
	}

	return did;
};

export default getDid;
