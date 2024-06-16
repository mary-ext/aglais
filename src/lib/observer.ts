export const intersectionCallback: IntersectionObserverCallback = (entries, observer) => {
	for (let idx = 0, len = entries.length; idx < len; idx++) {
		const entry = entries[idx];

		const target = entry.target as any;
		const listener = target.$onintersect;

		if (listener) {
			listener(entry);
		} else {
			observer.unobserve(target);
		}
	}
};

export const resizeCallback: ResizeObserverCallback = (entries, observer) => {
	for (let idx = 0, len = entries.length; idx < len; idx++) {
		const entry = entries[idx];

		const target = entry.target as any;
		const listener = target.$onresize;

		if (listener) {
			listener(entry);
		} else {
			observer.unobserve(target);
		}
	}
};

declare module 'solid-js' {
	namespace JSX {
		interface ExplicitProperties {
			$onintersect: (entry: IntersectionObserverEntry) => void;
			$onresize: (entry: ResizeObserverEntry) => void;
		}
	}
}
