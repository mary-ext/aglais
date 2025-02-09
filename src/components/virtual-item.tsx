import { type JSX, createSignal, onCleanup } from 'solid-js';

import { useIsFocused } from '~/lib/navigation/router';
import { intersectionCallback } from '~/lib/observer';
import { requestIdle } from '~/lib/utils/misc';

const intersectionObserver = new IntersectionObserver(intersectionCallback, { rootMargin: `106.25% 0%` });

export interface VirtualItemProps {
	estimateHeight?: number;
	children?: JSX.Element;
}

const VirtualItem = (props: VirtualItemProps) => {
	let _entry: IntersectionObserverEntry | undefined;
	let _height: number | undefined = props.estimateHeight;
	let _intersecting: boolean = false;

	const isFocused = useIsFocused();
	const [intersecting, setIntersecting] = createSignal(_intersecting);

	const shouldHide = () => !intersecting() && _height !== undefined;

	const handleIntersect = (nextEntry: IntersectionObserverEntry) => {
		_entry = undefined;

		if (!isFocused()) {
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
