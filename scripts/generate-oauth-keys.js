import * as fs from 'node:fs/promises';

import { generateClientAssertionKey } from '@atcute/oauth-crypto';
import * as TID from '@atcute/tid';

/** @type {import('@atcute/oauth-crypto').ClientAssertionPrivateJwk[]} */
let keys;
try {
	const raw = await fs.readFile('./oauth-credentials.local.json', 'utf-8');
	keys = JSON.parse(raw);
} catch (err) {
	if (err.code !== 'ENOENT') {
		throw err;
	}

	keys = [];
}

const kid = `aglais-${TID.now()}`;
const privateKey = await generateClientAssertionKey(kid, 'ES256');

keys = [privateKey, ...keys];

await fs.writeFile('./oauth-credentials.local.json', JSON.stringify(keys, null, '\t') + '\n');
