import type { XRPC } from '@atcute/client';
import type {
	At,
	ComAtprotoRepoGetRecord,
	ComAtprotoRepoListRecords,
	Records,
} from '@atcute/client/lexicons';

type RecordType = keyof Records;

export interface CreateRecordOptions<K extends RecordType> {
	repo: At.DID;
	collection: K;
	rkey?: string;
	record: Records[K];
	swapCommit?: string;
	validate?: boolean;
}

export const createRecord = async <K extends RecordType>(rpc: XRPC, options: CreateRecordOptions<K>) => {
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

export const putRecord = async <K extends RecordType>(rpc: XRPC, options: PutRecordOptions<K>) => {
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

export const deleteRecord = async <K extends RecordType>(rpc: XRPC, options: DeleteRecordOptions<K>) => {
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
	rpc: XRPC,
	options: GetRecordOptions<K>,
): Promise<GetRecordOutput<Records[K]>> => {
	const { data } = await rpc.get('com.atproto.repo.getRecord', {
		params: options,
	});

	return data as any;
};

export interface ListRecordsOptions<K extends RecordType> {
	signal?: AbortSignal;
	repo: At.DID;
	collection: K;
	cursor?: string;
	limit?: number;
}

export interface ListRecordsOutput<T> extends ComAtprotoRepoListRecords.Output {
	cursor?: string;
	records: { cid: At.CID; uri: At.Uri; value: T }[];
}

export const listRecords = async <K extends RecordType>(
	rpc: XRPC,
	options: ListRecordsOptions<K>,
): Promise<ListRecordsOutput<Records[K]>> => {
	const { data } = await rpc.get('com.atproto.repo.listRecords', {
		signal: options.signal,
		params: {
			repo: options.repo,
			collection: options.collection,
			limit: options.limit,
			cursor: options.cursor,
		},
	});

	return data as any;
};
