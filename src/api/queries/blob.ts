import { type Client, ok } from '@atcute/client';
import type { Blob as AtpBlob } from '@atcute/lexicons';

export const uploadBlob = async (client: Client, blob: Blob): Promise<AtpBlob<any>> => {
	const data = await ok(
		client.post('com.atproto.repo.uploadBlob', {
			input: blob,
		}),
	);

	return data.blob;
};
