import { createSignal, onCleanup, runWithOwner, type JSX } from 'solid-js';

import { requestIdle } from '~/lib/misc';
import { UNSAFE_routerEvents, UNSAFE_useViewContext } from '~/lib/navigation/router';
import { intersectionCallback } from '~/lib/observer';

const intersectionObserver = new IntersectionObserver(intersectionCallback, { rootMargin: `106.25% 0%` });

const createVirtualStore = (ctx: ReturnType<typeof UNSAFE_useViewContext>) => {
	return runWithOwner(ctx.owner, () => {
		let disabled = false;

		onCleanup(UNSAFE_routerEvents.on(ctx.route.id, (active) => (disabled = !active)));

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

const dummyStore: ReturnType<typeof createVirtualStore> = {
	disabled: false,
};

const getVirtualStore = (ctx: ReturnType<typeof UNSAFE_useViewContext> | undefined) => {
	if (ctx === undefined) {
		return dummyStore;
	}

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
	let _intersecting: boolean = false;

	const store = getVirtualStore(UNSAFE_useViewContext());

	const [intersecting, setIntersecting] = createSignal(_intersecting);

	const shouldHide = () => !intersecting() && _height !== undefined;

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

			requestIdle(() => {
				// bail out if it's no longer us.
				if (_entry !== nextEntry) {
					return;
				}

				// reduce the precision
				_height = ((_entry.boundingClientRect.height * 1000) | 0) / 1000;
				_entry = undefined;

				setIntersecting((_intersecting = next));
			});
		}
	};

	return (
		<article
			ref={startMeasure}
			class="shrink-0 contain-content"
			style={{ height: shouldHide() ? `${_height ?? 0}px` : undefined }}
			prop:$onintersect={handleIntersect}
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

	onCleanup(() => {
		intersectionObserver.unobserve(node);
	});
};
