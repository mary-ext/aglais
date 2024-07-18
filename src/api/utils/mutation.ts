import { BskyXRPC } from '@mary/bluesky-client';
import type { At, Records, ComAtprotoRepoGetRecord } from '@mary/bluesky-client/lexicons';

type RecordType = keyof Records;

export interface CreateRecordOptions<K extends RecordType> {
	repo: At.DID;
	collection: K;
	rkey?: string;
	record: Records[K];
	swapCommit?: string;
	validate?: boolean;
}

export const createRecord = async <K extends RecordType>(rpc: BskyXRPC, options: CreateRecordOptions<K>) => {
	const { data } = await rpc.call('com.atproto.repo.createRecord', { data: options });

	return data;
};

export interface PutRecordOptions<K extends RecordType> {
	repo: At.DID;
	collection: K;
	rkey: string;
	record: Records[K];
	swapCommit?: string;
	swapRecord?: At.CID | null;
	validate?: boolean;
}

export const putRecord = async <K extends RecordType>(rpc: BskyXRPC, options: PutRecordOptions<K>) => {
	const { data } = await rpc.call('com.atproto.repo.putRecord', { data: options });

	return data;
};

export interface DeleteRecordOptions<K extends RecordType> {
	repo: At.DID;
	collection: K;
	rkey: string;
	swapCommit?: string;
	swapRecord?: string;
}

export const deleteRecord = async <K extends RecordType>(rpc: BskyXRPC, options: DeleteRecordOptions<K>) => {
	await rpc.call('com.atproto.repo.deleteRecord', {
		data: options,
	});
};

export interface GetRecordOptions<K extends RecordType> {
	repo: At.DID;
	collection: K;
	rkey: string;
	cid?: string;
}

export interface GetRecordOutput<T> extends ComAtprotoRepoGetRecord.Output {
	value: T;
}

export const getRecord = async <K extends RecordType>(
	rpc: BskyXRPC,
	options: GetRecordOptions<K>,
): Promise<GetRecordOutput<Records[K]>> => {
	const { data } = await rpc.get('com.atproto.repo.getRecord', {
		params: options,
	});

	return data as any;
};
