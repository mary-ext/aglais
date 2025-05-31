import type { AppBskyGraphDefs } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import { createQuery } from '@mary/solid-query';

import { useAgent } from '~/lib/states/agent';
import { useSession } from '~/lib/states/session';

export type MyListsFilter = 'all' | 'curation' | 'moderation' | 'all-including-subscribed';

export const createMyListsQuery = (filter: MyListsFilter) => {
	const { client } = useAgent();
	const { currentAccount } = useSession();

	return createQuery(() => ({
		queryKey: ['my-lists', filter],
		async queryFn({ signal }) {
			const promises = [
				accumulate(async (cursor) => {
					const data = await ok(
						client.get('app.bsky.graph.getLists', {
							signal,
							params: {
								actor: currentAccount!.did,
								cursor,
								limit: 100,
							},
						}),
					);

					return {
						cursor: data.cursor,
						items: data.lists,
					};
				}),
			];

			if (filter === 'all-including-subscribed' || filter === 'moderation') {
				promises.push(
					accumulate(async (cursor) => {
						const data = await ok(
							client.get('app.bsky.graph.getListMutes', {
								signal,
								params: {
									cursor,
									limit: 100,
								},
							}),
						);

						return {
							cursor: data.cursor,
							items: data.lists,
						};
					}),
				);

				promises.push(
					accumulate(async (cursor) => {
						const data = await ok(
							client.get('app.bsky.graph.getListBlocks', {
								signal,
								params: {
									cursor,
									limit: 100,
								},
							}),
						);

						return {
							cursor: data.cursor,
							items: data.lists,
						};
					}),
				);
			}

			const resultset = await Promise.all(promises);

			const collator = new Intl.Collator();
			const known = new Set<string>();

			const lists: AppBskyGraphDefs.ListView[] = [];

			for (const result of resultset) {
				for (const list of result) {
					if (
						(filter === 'curation' && list.purpose !== 'app.bsky.graph.defs#curatelist') ||
						(filter === 'moderation' && list.purpose !== 'app.bsky.graph.defs#modlist')
					) {
						continue;
					}

					if (known.has(list.uri)) {
						continue;
					}

					known.add(list.uri);
					lists.push(list);
				}
			}

			lists.sort((a, b) => collator.compare(a.name, b.name));
			return lists;
		},
	}));
};

interface AccumulateResponse<T> {
	cursor?: string;
	items: T[];
}

type AccumulateFetchFn<T> = (cursor: string | undefined) => Promise<AccumulateResponse<T>>;

const accumulate = async <T>(fn: AccumulateFetchFn<T>, limit = 100): Promise<T[]> => {
	let cursor: string | undefined;
	let acc: T[] = [];

	for (let i = 0; i < limit; i++) {
		const res = await fn(cursor);
		cursor = res.cursor;
		acc = acc.concat(res.items);
		if (!cursor) {
			break;
		}
	}

	return acc;
};
