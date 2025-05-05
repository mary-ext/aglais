import { type Client, ok } from '@atcute/client';
import type {
	At,
	ComAtprotoRepoGetRecord,
	ComAtprotoRepoListRecords,
	Records,
} from '@atcute/client/lexicons';

type RecordType = keyof Records;

export interface CreateRecordOptions<K extends RecordType> {
	repo: At.Did;
	collection: K;
	rkey?: string;
	record: Records[K];
	swapCommit?: string;
	validate?: boolean;
}

export const createRecord = async <K extends RecordType>(client: Client, options: CreateRecordOptions<K>) => {
	const data = await ok(
		client.post('com.atproto.repo.createRecord', {
			input: options,
		}),
	);

	return data;
};

export interface PutRecordOptions<K extends RecordType> {
	repo: At.Did;
	collection: K;
	rkey: string;
	record: Records[K];
	swapCommit?: string;
	swapRecord?: At.Cid | null;
	validate?: boolean;
}

export const putRecord = async <K extends RecordType>(client: Client, options: PutRecordOptions<K>) => {
	const data = await ok(
		client.post('com.atproto.repo.putRecord', {
			input: options,
		}),
	);

	return data;
};

export interface DeleteRecordOptions<K extends RecordType> {
	repo: At.Did;
	collection: K;
	rkey: string;
	swapCommit?: string;
	swapRecord?: string;
}

export const deleteRecord = async <K extends RecordType>(client: Client, options: DeleteRecordOptions<K>) => {
	await ok(
		client.post('com.atproto.repo.deleteRecord', {
			input: options,
		}),
	);
};

export interface GetRecordOptions<K extends RecordType> {
	signal?: AbortSignal;
	repo: At.Did;
	collection: K;
	rkey: string;
	cid?: string;
}

export interface GetRecordOutput<T> extends ComAtprotoRepoGetRecord.Output {
	value: T;
}

export const getRecord = async <K extends RecordType>(
	client: Client,
	options: GetRecordOptions<K>,
): Promise<GetRecordOutput<Records[K]>> => {
	const data = await ok(
		client.get('com.atproto.repo.getRecord', {
			signal: options.signal,
			params: {
				repo: options.repo,
				collection: options.collection,
				rkey: options.rkey,
				cid: options.cid,
			},
		}),
	);

	return data as any;
};

export interface ListRecordsOptions<K extends RecordType> {
	signal?: AbortSignal;
	repo: At.Did;
	collection: K;
	cursor?: string;
	limit?: number;
}

export interface ListRecordsOutput<T> extends ComAtprotoRepoListRecords.Output {
	cursor?: string;
	records: { cid: At.Cid; uri: At.ResourceUri; value: T }[];
}

export const listRecords = async <K extends RecordType>(
	client: Client,
	options: ListRecordsOptions<K>,
): Promise<ListRecordsOutput<Records[K]>> => {
	const data = await ok(
		client.get('com.atproto.repo.listRecords', {
			signal: options.signal,
			params: {
				repo: options.repo,
				collection: options.collection,
				limit: options.limit,
				cursor: options.cursor,
			},
		}),
	);

	return data as any;
};
