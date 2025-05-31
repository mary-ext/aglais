import { For, type JSX, Match, Switch, untrack } from 'solid-js';

import { getQueryErrorInfo } from '~/api/utils/query';

import { ifIntersect } from '~/lib/element-refs';
import { useIsFocused } from '~/lib/navigation/router';

import CircularProgress from './circular-progress';
import ErrorView from './error-view';

export interface ListProps<T> {
	data?: T[];
	error?: unknown;
	render: (item: T, index: () => number) => JSX.Element;
	fallback?: JSX.Element;
	manualScroll?: boolean;
	hasNewData?: boolean;
	hasNextPage?: boolean;
	isRefreshing?: boolean;
	isFetchingNextPage?: boolean;
	onEndReached?: () => void;
	onRefresh?: () => void;
}

const List = <T,>(props: ListProps<T>) => {
	const render = props.render;

	const onEndReached = props.onEndReached;
	const onRefresh = props.onRefresh;

	return (
		<div class="flex flex-col">
			<Switch>
				<Match when={props.isRefreshing}>
					<div class="grid h-13 shrink-0 place-items-center border-b border-outline">
						<CircularProgress />
					</div>
				</Match>

				<Match when={props.hasNewData}>
					<button
						onClick={onRefresh}
						class="hover:bg-border-outline-25 grid h-13 shrink-0 place-items-center border-b border-outline text-sm text-accent"
					>
						Show new items
					</button>
				</Match>
			</Switch>

			<For
				each={props.data}
				fallback={
					(() => {
						if (props.manualScroll || !props.hasNextPage) {
							return untrack(() => props.fallback);
						}
					}) as unknown as JSX.Element
				}
			>
				{render}
			</For>

			<Switch>
				<Match when={props.isRefreshing}>{null}</Match>

				<Match when={props.error}>
					{(err) => (
						<ErrorView
							error={err()}
							onRetry={() => {
								const info = getQueryErrorInfo(err());

								if (info && info.pageParam === undefined) {
									onRefresh?.();
								} else {
									onEndReached?.();
								}
							}}
						/>
					)}
				</Match>

				<Match when={props.manualScroll && !props.isFetchingNextPage && props.hasNextPage}>
					<button
						onClick={onEndReached}
						class="grid h-13 shrink-0 place-items-center text-sm text-accent hover:bg-contrast/sm"
					>
						Show more
					</button>
				</Match>

				<Match when={props.isFetchingNextPage || props.hasNextPage}>
					<div
						ref={(node) => {
							if (onEndReached) {
								const isFocused = useIsFocused();

								ifIntersect(
									node,
									() => !props.isFetchingNextPage && !props.isRefreshing && props.hasNextPage && isFocused(),
									onEndReached,
									{ rootMargin: '200% 0%' },
								);
							}
						}}
						class="h-[50svh] shrink-0"
					>
						<div class="grid place-items-center py-8">
							<CircularProgress />
						</div>
					</div>
				</Match>

				<Match when={props.data}>
					<div class="h-[50svh] shrink-0">
						<div class="grid place-items-center py-8">
							<div class="h-1 w-1 rounded-full bg-contrast-muted"></div>
						</div>
					</div>
				</Match>
			</Switch>
		</div>
	);
};

export default List;
