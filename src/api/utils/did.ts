import { type Client, ok } from '@atcute/client';
import type { Did, Handle } from '@atcute/lexicons';
import { isDid } from '@atcute/lexicons/syntax';

const getDid = async (client: Client, actor: Handle, signal?: AbortSignal) => {
	let did: Did;
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
