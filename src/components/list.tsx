import { For, Match, Switch, untrack, type JSX } from 'solid-js';

import { getQueryErrorInfo } from '~/api/utils/query';

import { ifIntersect } from '~/lib/element-refs';

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
					<div class="grid h-13 shrink-0 place-items-center border-b border-c-contrast-200">
						<CircularProgress />
					</div>
				</Match>

				<Match when={props.hasNewData}>
					<button
						onClick={onRefresh}
						class="grid h-13 shrink-0 place-items-center border-b border-c-contrast-200 text-sm text-c-primary-400 hover:bg-c-contrast-25"
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
						class="grid h-13 shrink-0 place-items-center text-sm text-c-primary-400 hover:bg-c-contrast-25"
					>
						Show more
					</button>
				</Match>

				<Match when={props.isFetchingNextPage || props.hasNextPage}>
					<div
						ref={(node) => {
							if (onEndReached) {
								ifIntersect(node, () => !props.isFetchingNextPage && props.hasNextPage, onEndReached);
							}
						}}
						class="grid h-13 shrink-0 place-items-center"
					>
						<CircularProgress />
					</div>
				</Match>

				<Match when={props.data}>
					<div class="grid h-13 shrink-0 place-items-center">
						<p class="text-sm text-c-contrast-400">End of list</p>
					</div>
				</Match>
			</Switch>
		</div>
	);
};

export default List;
