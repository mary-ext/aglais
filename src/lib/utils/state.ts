import { $RAW } from 'solid-js/store';

export const snapshot = <T>(value: T, map: WeakMap<any, any> = new WeakMap()): T => {
	const v = value as any;

	if (v == null || typeof v !== 'object') {
		return v;
	}

	if (!v[$RAW]) {
		return v;
	}

	const cached = map.get(v);
	if (cached) {
		return cached;
	}

	const proto = Object.getPrototypeOf(v);
	switch (proto) {
		case Array.prototype: {
			const result: unknown[] = new Array(v.length);
			for (let idx = 0, len = v.length; idx < len; idx++) {
				result[idx] = snapshot(v[idx], map);
			}

			map.set(v, result);
			return result as T;
		}
		case Object.prototype: {
			const result: Record<PropertyKey, unknown> = {};
			for (const key in v) {
				result[key] = snapshot(v[key], map);
			}

			map.set(v, result);
			return result as T;
		}
	}

	return v;
};
