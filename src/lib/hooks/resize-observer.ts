import { onCleanup } from 'solid-js';

export const useResizeObserver = (node: HTMLElement, callback: () => void) => {
	const observer = new ResizeObserver(callback);

	onCleanup(() => observer.disconnect());
	observer.observe(node);
};
