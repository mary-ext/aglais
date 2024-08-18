import type { XRPC } from '@atcute/client';
import type { At } from '@atcute/client/lexicons';

export const uploadBlob = async (rpc: XRPC, blob: Blob): Promise<At.Blob<any>> => {
	const { data } = await rpc.call('com.atproto.repo.uploadBlob', { data: blob });
	return data.blob;
};
