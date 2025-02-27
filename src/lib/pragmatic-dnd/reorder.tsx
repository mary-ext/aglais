import {
	type Edge,
	attachClosestEdge,
	extractClosestEdge,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { getReorderDestinationIndex } from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/get-reorder-destination-index';
import {
	draggable,
	dropTargetForElements,
	monitorForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { pointerOutsideOfPreview } from '@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview';
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview';
import { reorder } from '@atlaskit/pragmatic-drag-and-drop/reorder';
import {
	type JSX,
	createContext,
	createEffect,
	createSignal,
	onCleanup,
	onMount,
	useContext,
} from 'solid-js';

type DropItem = {
	key: symbol;
	index: number;
};

const createDropItem = (key: symbol, index: number): DropItem => {
	return { key, index };
};

const isDropItem = (item: Record<symbol | string, unknown>, key: symbol): item is DropItem => {
	return item.key === key;
};

const Context = createContext<{
	key: symbol;
	axis: 'vertical' | 'horizontal';
	list: () => unknown[];
	onReorder: (list: unknown[]) => void;
}>();

export interface ReorderableProps<T> {
	list: T[];
	// Expected to be static
	axis?: 'vertical' | 'horizontal';
	onReorder: (list: T[]) => void;
	children: JSX.Element;
}

export const Reorderable = <T,>(props: ReorderableProps<T>) => {
	const onReorder = props.onReorder;

	const key = Symbol();
	const axis = props.axis ?? 'vertical';

	onMount(() => {
		onCleanup(
			monitorForElements({
				canMonitor({ source }) {
					return isDropItem(source.data, key);
				},
				onDrop({ location, source }) {
					const target = location.current.dropTargets[0];
					if (!target) {
						return;
					}

					const sourceData = source.data;
					const targetData = target.data;
					if (!isDropItem(sourceData, key) || !isDropItem(targetData, key)) {
						return;
					}

					const closestEdgeOfTarget = extractClosestEdge(targetData);
					const startIndex = sourceData.index;
					const indexOfTarget = targetData.index;

					const finishIndex = getReorderDestinationIndex({
						startIndex,
						indexOfTarget,
						closestEdgeOfTarget,
						axis,
					});

					// no change.
					if (finishIndex === startIndex) {
						return;
					}

					onReorder(reorder({ list: props.list, startIndex, finishIndex }));
				},
			}),
		);
	});

	return (
		<Context.Provider
			value={{
				key,
				axis,
				list: () => props.list,
				onReorder: onReorder as (list: unknown[]) => void,
			}}
		>
			{props.children}
		</Context.Provider>
	);
};

export interface UseReorderableItemReturn {
	refs: {
		element: (element: HTMLElement | undefined) => void;
		handle: (element: HTMLElement | undefined) => void;
	};

	readonly edge: Edge | undefined;
	readonly preview: HTMLElement | undefined;

	canMove: (direction: -1 | 1) => boolean;
	move: (direction: -1 | 1) => void;
}

const noopReorderableItem: UseReorderableItemReturn = {
	refs: {
		element: () => {},
		handle: () => {},
	},

	edge: undefined,
	preview: undefined,

	canMove: () => false,
	move: () => {},
};

export interface ReorderableItemOptions {
	index: () => number;
	renderPreview?: boolean;
}

export const useReorderableItem = ({
	index,
	renderPreview = false,
}: ReorderableItemOptions): UseReorderableItemReturn => {
	const context = useContext(Context);
	if (!context) {
		return noopReorderableItem;
	}

	const [element, setElement] = createSignal<HTMLElement>();
	const [handle, setHandle] = createSignal<HTMLElement>();

	const [edge, setEdge] = createSignal<Edge>();
	const [preview, setPreview] = createSignal<HTMLElement>();

	createEffect(() => {
		const $element = element();
		const $handle = handle();

		const $index = index();

		if ($index === -1 || $element === undefined) {
			return;
		}

		const data = createDropItem(context.key, $index);

		onCleanup(() => {
			setEdge();
			setPreview();
		});

		onCleanup(
			draggable({
				element: $element,
				dragHandle: $handle,
				getInitialData() {
					return data;
				},
				onGenerateDragPreview({ nativeSetDragImage }) {
					if (renderPreview) {
						setCustomNativeDragPreview({
							nativeSetDragImage,
							getOffset: pointerOutsideOfPreview({ x: '14px', y: '18px' }),
							render({ container }) {
								setPreview(container);
								return () => setPreview();
							},
						});
					}
				},
			}),
		);

		onCleanup(
			dropTargetForElements({
				element: $element,
				canDrop({ source }) {
					return isDropItem(source.data, context.key);
				},
				getData({ input }) {
					return attachClosestEdge(data, {
						element: $element,
						input,
						allowedEdges: context.axis === 'vertical' ? ['top', 'bottom'] : ['left', 'right'],
					});
				},
				onDrag({ self, source }) {
					if (source.element === $element) {
						setEdge();
						return;
					}

					const closestEdge = extractClosestEdge(self.data);

					const sourceIndex = (source.data as DropItem).index;
					const isItemBeforeSource = $index === sourceIndex - 1;
					const isItemAfterSource = $index === sourceIndex + 1;

					const isDropIndicatorHidden =
						(isItemBeforeSource && (closestEdge === 'bottom' || closestEdge === 'right')) ||
						(isItemAfterSource && (closestEdge === 'top' || closestEdge === 'left'));

					setEdge(!isDropIndicatorHidden ? (closestEdge ?? undefined) : undefined);
				},
				onDragLeave() {
					setEdge();
				},
				onDrop() {
					setEdge();
				},
			}),
		);
	});

	return {
		refs: {
			element: setElement,
			handle: setHandle,
		},

		get edge() {
			return edge();
		},
		get preview() {
			return renderPreview ? preview() : undefined;
		},

		canMove: (direction) => {
			const $list = context.list();
			const $index = index();

			return (direction === -1 && $index > 0) || (direction === 1 && $index < $list.length - 1);
		},
		move: (direction) => {
			const $list = context.list();
			const $index = index();

			const newIndex = $index + direction;

			if (newIndex < 0 || newIndex >= $list.length) {
				return;
			}

			const next = [...$list];
			[next[$index], next[newIndex]] = [next[newIndex], next[$index]];

			context.onReorder(next);
		},
	};
};
