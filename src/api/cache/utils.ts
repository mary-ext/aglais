import { type QueryClient, type QueryFilters, matchQuery } from '@mary/solid-query';

export interface CacheMatcher<T> {
	filter: QueryFilters | QueryFilters[];
	iterate: (data: any) => Generator<T>;
}

export function* iterateQueryCache<T>(queryClient: QueryClient, matchers: CacheMatcher<T>[]): Generator<T> {
	const queries = queryClient.getQueryCache().getAll();
	queries.sort((a, b) => b.state.dataUpdatedAt - a.state.dataUpdatedAt);

	for (let i = 0, ilen = queries.length; i < ilen; i++) {
		const query = queries[i];
		const data = query.state.data;

		if (data === undefined) {
			continue;
		}

		for (let j = 0, jlen = matchers.length; j < jlen; j++) {
			const matcher = matchers[j];
			const filter = matcher.filter;

			if (Array.isArray(filter) ? filter.some((f) => matchQuery(f, query)) : matchQuery(filter, query)) {
				yield* matcher.iterate(data);
			}
		}
	}
}
