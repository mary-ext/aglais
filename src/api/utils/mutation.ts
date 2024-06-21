import type { BskyXRPC } from '@mary/bluesky-client';
import type { At, Records } from '@mary/bluesky-client/lexicons';

export interface CreateRecordOptions<K extends keyof Records> {
	repo: At.DID;
	collection: K;
	rkey?: string;
	record: Records[K];
	swapCommit?: string;
	validate?: boolean;
}

export const createRecord = async <K extends keyof Records>(
	rpc: BskyXRPC,
	options: CreateRecordOptions<K>,
) => {
	const { data } = await rpc.call('com.atproto.repo.createRecord', { data: options });

	return data;
};

export interface DeleteRecordOptions<K extends keyof Records> {
	repo: At.DID;
	collection: K;
	rkey: string;
	swapCommit?: string;
	swapRecord?: string;
}

export const deleteRecord = async <K extends keyof Records>(
	rpc: BskyXRPC,
	options: DeleteRecordOptions<K>,
) => {
	await rpc.call('com.atproto.repo.deleteRecord', {
		data: options,
	});
};
