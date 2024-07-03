import { matchQuery, type QueryClient, type QueryFilters } from '@mary/solid-query';

export interface CacheMatcher<T> {
	filter: QueryFilters;
	iterate: (data: any) => Generator<T>;
}

export function* iterateQueryCache<T>(queryClient: QueryClient, matchers: CacheMatcher<T>[]): Generator<T> {
	const queries = queryClient.getQueryCache().getAll();

	for (let i = 0, ilen = queries.length; i < ilen; i++) {
		const query = queries[i];
		const data = query.state.data;

		if (data === undefined) {
			continue;
		}

		for (let j = 0, jlen = matchers.length; j < jlen; j++) {
			const matcher = matchers[j];

			if (matchQuery(matcher.filter, query)) {
				yield* matcher.iterate(data);
			}
		}
	}
}
