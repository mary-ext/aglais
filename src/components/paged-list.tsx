import { For, Match, Switch, untrack, type JSX } from 'solid-js';

import { getQueryErrorInfo } from '~/api/utils/query';

import { ifIntersect } from '~/lib/element-refs';

import CircularProgress from './circular-progress';
import EndOfListView from './end-of-list-view';
import ErrorView from './error-view';

export interface PagedListProps<T> {
	data?: T[][];
	error?: unknown;
	render: (item: T, index: number) => JSX.Element;
	fallback?: JSX.Element;
	manualScroll?: boolean;
	hasNewData?: boolean;
	hasNextPage?: boolean;
	isRefreshing?: boolean;
	isFetchingNextPage?: boolean;
	onEndReached?: () => void;
	onRefresh?: () => void;
	extraBottomGutter?: boolean;
}

const PagedList = <T,>(props: PagedListProps<T>) => {
	const render = props.render;
	const extraBottomGutter = props.extraBottomGutter;

	const onEndReached = props.onEndReached;
	const onRefresh = props.onRefresh;

	return (
		<div class={'flex flex-col' + (extraBottomGutter ? ` pb-4` : ``)}>
			<Switch>
				<Match when={props.isFetchingNextPage}>{null}</Match>

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
				{(array) => array.map(render)}
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
								ifIntersect(node, () => !props.isFetchingNextPage && props.hasNextPage, onEndReached, {
									rootMargin: `150% 0%`,
								});
							}
						}}
						class="grid h-13 shrink-0 place-items-center"
					>
						<CircularProgress />
					</div>
				</Match>

				<Match when={props.data}>
					<EndOfListView />
				</Match>
			</Switch>
		</div>
	);
};

export default PagedList;
