import {
	type InfiniteData,
	type QueryClient,
	type QueryFunctionContext,
	type QueryKey,
} from '@mary/solid-query';

export const resetInfiniteData = (client: QueryClient, key: QueryKey) => {
	client.setQueryData<InfiniteData<unknown>>(key, (data) => {
		if (data && data.pages.length > 1) {
			return {
				pages: data.pages.slice(0, 1),
				pageParams: data.pageParams.slice(0, 1),
			};
		}

		return data;
	});
};

const errorMap = new WeakMap<WeakKey, { pageParam: any; direction: 'forward' | 'backward' }>();

export const wrapQuery = <TQueryData, TPageParam, TQueryKey extends QueryKey = QueryKey>(
	fn: (ctx: QueryFunctionContext<TQueryKey, TPageParam>) => Promise<TQueryData>,
) => {
	return async (ctx: QueryFunctionContext<TQueryKey, TPageParam>): Promise<TQueryData> => {
		try {
			return await fn(ctx);
		} catch (err) {
			// @ts-expect-error
			errorMap.set(err as any, { pageParam: ctx.pageParam, direction: ctx.direction });
			throw err;
		}
	};
};

export const getQueryErrorInfo = (err: unknown) => {
	const info = errorMap.get(err as any);
	return info;
};
