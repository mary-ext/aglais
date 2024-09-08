// Keeps a best-effort log of history entries.
// To simplify our stack router implementation on dealing with PWA-specific
// aspects, `createHistoryLogger` is set to drop forward entries by default.
import type { History, Location } from './history';

export interface HistoryLogger {
	readonly current: Location;
	readonly active: number;
	readonly entries: (Location | null)[];
	readonly canGoBack: boolean;
	readonly canGoForward: boolean;
}

export const createHistoryLogger = (history: History, keepForwardEntries = false): HistoryLogger => {
	const loc = history.location;

	let active = loc.index;
	let entries = arr(active + 1, (i) => (i === active ? loc : null));

	history.listen(({ action, location }) => {
		const index = location.index;

		if (action === 'push') {
			// New page pushed

			entries = entries.toSpliced(active + 1, entries.length, location);
		} else if (action === 'replace' || action === 'update') {
			// Current page replaced, or updated with new state

			entries = entries.with(active, location);
		} else if (action === 'traverse') {
			// Traversal happened

			if (keepForwardEntries) {
				if (index >= entries.length) {
					const length = entries.length;
					const delta = index - length;

					const extras = arr(delta + 1, (i) => (i === delta ? location : null));

					entries = entries.concat(extras);
				} else if (entries[index] === null) {
					entries = entries.with(index, location);
				}
			} else {
				if (index < active) {
					if (entries[index] !== null) {
						entries = entries.slice(0, index + 1);
					} else {
						entries = entries.toSpliced(index, entries.length, location);
					}
				} else if (index >= entries.length) {
					const length = entries.length;
					const delta = index - length;

					const extras = arr(delta + 1, (i) => (i === delta ? location : null));

					entries = entries.concat(extras);
				}
			}
		}

		active = index;
	});

	return {
		get current() {
			// Current entry is guaranteed to exist
			return entries[active]!;
		},
		get active() {
			return active;
		},
		get entries() {
			return entries;
		},

		get canGoBack() {
			return active !== 0;
		},
		get canGoForward() {
			return active !== entries.length - 1;
		},
	};
};

const arr = <T>(length: number, map: (index: number) => T): T[] => {
	return Array.from({ length }, (_, idx) => map(idx));
};
