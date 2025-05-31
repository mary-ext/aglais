import type { ComAtprotoRepoGetRecord, ComAtprotoRepoListRecords } from '@atcute/atproto';
import { type Client, ok } from '@atcute/client';
import type { Cid, Did, InferInput, ResourceUri } from '@atcute/lexicons';
import type { Records } from '@atcute/lexicons/ambient';

type RecordType = keyof Records;

export interface CreateRecordOptions<K extends RecordType> {
	repo: Did;
	collection: K;
	rkey?: string;
	record: InferInput<Records[K]>;
	swapCommit?: string;
	validate?: boolean;
}

export const createRecord = async <K extends RecordType>(client: Client, options: CreateRecordOptions<K>) => {
	const data = await ok(
		client.post('com.atproto.repo.createRecord', {
			input: options as any,
		}),
	);

	return data;
};

export interface PutRecordOptions<K extends RecordType> {
	repo: Did;
	collection: K;
	rkey: string;
	record: InferInput<Records[K]>;
	swapCommit?: string;
	swapRecord?: Cid | null;
	validate?: boolean;
}

export const putRecord = async <K extends RecordType>(client: Client, options: PutRecordOptions<K>) => {
	const data = await ok(
		client.post('com.atproto.repo.putRecord', {
			input: options as any,
		}),
	);

	return data;
};

export interface DeleteRecordOptions<K extends RecordType> {
	repo: Did;
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
	repo: Did;
	collection: K;
	rkey: string;
	cid?: string;
}

export type GetRecordOutput<T> = ComAtprotoRepoGetRecord.$output & {
	value: T;
};

export const getRecord = async <K extends RecordType>(
	client: Client,
	options: GetRecordOptions<K>,
): Promise<GetRecordOutput<InferInput<Records[K]>>> => {
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
	repo: Did;
	collection: K;
	cursor?: string;
	limit?: number;
}

export type ListRecordsOutput<T> = ComAtprotoRepoListRecords.$output & {
	cursor?: string;
	records: { cid: Cid; uri: ResourceUri; value: T }[];
};

export const listRecords = async <K extends RecordType>(
	client: Client,
	options: ListRecordsOptions<K>,
): Promise<ListRecordsOutput<InferInput<Records[K]>>> => {
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
