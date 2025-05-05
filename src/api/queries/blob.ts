import { type Client, ok } from '@atcute/client';
import type { At } from '@atcute/client/lexicons';

export const uploadBlob = async (client: Client, blob: Blob): Promise<At.Blob<any>> => {
	const data = await ok(
		client.post('com.atproto.repo.uploadBlob', {
			input: blob,
		}),
	);

	return data.blob;
};
