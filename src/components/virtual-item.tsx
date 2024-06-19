import { createEffect, createRenderEffect, createSignal, onCleanup, runWithOwner, type JSX } from 'solid-js';

import { UNSAFE_useViewContext } from '~/lib/navigation/router';
import { intersectionCallback, resizeCallback } from '~/lib/observer';

const intersectionObserver = new IntersectionObserver(intersectionCallback, { rootMargin: `106.25% 0%` });
const resizeObserver = new ResizeObserver(resizeCallback);

const createVirtualStore = (ctx: ReturnType<typeof UNSAFE_useViewContext>) => {
	return runWithOwner(ctx.owner, () => {
		const active = ctx.active;
		let disabled = false;

		createRenderEffect(() => {
			if (!active()) {
				disabled = true;
			}
		});

		createEffect(() => {
			if (active()) {
				disabled = false;
			}
		});

		return {
			get disabled() {
				return disabled;
			},
		};
	})!;
};

const virtualStoreMap = new WeakMap<
	ReturnType<typeof UNSAFE_useViewContext>,
	ReturnType<typeof createVirtualStore>
>();

const getVirtualStore = (ctx: ReturnType<typeof UNSAFE_useViewContext>) => {
	let store = virtualStoreMap.get(ctx);
	if (store === undefined) {
		virtualStoreMap.set(ctx, (store = createVirtualStore(ctx)));
	}

	return store;
};

export interface VirtualItemProps {
	estimateHeight?: number;
	children?: JSX.Element;
}

const VirtualItem = (props: VirtualItemProps) => {
	let _entry: IntersectionObserverEntry | undefined;
	let _height: number | undefined = props.estimateHeight;
	let _intersecting = false;

	const store = getVirtualStore(UNSAFE_useViewContext());

	const [intersecting, setIntersecting] = createSignal(_intersecting);
	const [storedHeight, setStoredHeight] = createSignal(_height);

	const shouldHide = () => !intersecting() && (_height ?? storedHeight()) !== undefined;

	const handleIntersect = (nextEntry: IntersectionObserverEntry) => {
		_entry = undefined;

		if (store.disabled) {
			return;
		}

		const prev = _intersecting;
		const next = nextEntry.isIntersecting;

		if (!prev && next) {
			// hidden -> visible
			setIntersecting((_intersecting = next));
		} else if (prev && !next) {
			// visible -> hidden
			// unmounting is cheap, but we don't need to immediately unmount it, say
			// for scenarios where layout is still being figured out and we don't
			// actually know where the virtual container is gonna end up.

			_entry = nextEntry;

			requestIdleCallback(() => {
				// bail out if it's no longer us.
				if (_entry !== nextEntry) {
					return;
				}

				_entry = undefined;
				setIntersecting((_intersecting = next));
			});
		}
	};

	const handleResize = (nextEntry: ResizeObserverEntry) => {
		if ((!_intersecting && _height !== undefined) || store.disabled) {
			return;
		}

		const contentRect = nextEntry.contentRect;
		const nextHeight = ((contentRect.height * 1000) | 0) / 1000;

		if (nextHeight !== _height) {
			setStoredHeight((_height = nextHeight));
		}
	};

	return (
		<article
			ref={startMeasure}
			class="shrink-0"
			style={{
				contain: 'content',
				height: shouldHide() ? `${_height ?? storedHeight()}px` : undefined,
			}}
			prop:$onintersect={handleIntersect}
			prop:$onresize={handleResize}
		>
			{(() => {
				if (!shouldHide()) {
					return props.children;
				}
			})()}
		</article>
	);
};

export default VirtualItem;

const startMeasure = (node: HTMLElement) => {
	intersectionObserver.observe(node);
	resizeObserver.observe(node);

	onCleanup(() => {
		intersectionObserver.unobserve(node);
		resizeObserver.unobserve(node);
	});
};
