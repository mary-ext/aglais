import type { BskyXRPC } from '@mary/bluesky-client';
import type { At } from '@mary/bluesky-client/lexicons';

export const uploadBlob = async (rpc: BskyXRPC, blob: Blob): Promise<At.Blob<any>> => {
	const { data } = await rpc.call('com.atproto.repo.uploadBlob', { data: blob });
	return data.blob;
};
