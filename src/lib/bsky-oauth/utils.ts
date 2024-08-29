type FalsyValue = false | 0 | null | undefined;

export const decoder = new TextDecoder();
export const encoder = new TextEncoder();

export const extractContentType = (headers: Headers): string | undefined => {
	return headers.get('content-type')?.split(';')[0];
};

export const followAbortSignals = (...signals: (AbortSignal | FalsyValue)[]): AbortSignal | undefined => {
	const filtered = signals.filter((v) => !!v);

	if (filtered.length === 0) {
		return;
	}
	if (filtered.length === 1) {
		return filtered[0];
	}

	const controller = new AbortController();
	const own = controller.signal;

	for (let idx = 0, len = filtered.length; idx < len; idx++) {
		const signal = filtered[idx];

		if (signal.aborted) {
			controller.abort(signal.reason);
			break;
		}

		signal.addEventListener('abort', () => controller.abort(signal.reason), { signal: own });
	}

	return own;
};

export const toBase64Url = (input: Uint8Array): string => {
	const CHUNK_SIZE = 0x8000;
	const arr = [];

	for (let i = 0; i < input.byteLength; i += CHUNK_SIZE) {
		// @ts-expect-error
		arr.push(String.fromCharCode.apply(null, input.subarray(i, i + CHUNK_SIZE)));
	}

	return btoa(arr.join('')).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
};

export const fromBase64Url = (input: string): Uint8Array => {
	try {
		const binary = atob(input.replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, ''));
		const bytes = new Uint8Array(binary.length);

		for (let i = 0; i < binary.length; i++) {
			bytes[i] = binary.charCodeAt(i);
		}

		return bytes;
	} catch (err) {
		throw new TypeError(`invalid base64url`, { cause: err });
	}
};

export const parseB64uJson = (input: string) => {
	const bytes = fromBase64Url(input);
	const text = decoder.decode(bytes);

	return JSON.parse(text);
};

export const toSha256 = async (input: string): Promise<string> => {
	const bytes = encoder.encode(input);
	const digest = await crypto.subtle.digest('SHA-256', bytes);

	return toBase64Url(new Uint8Array(digest));
};

export const randomBytes = (length: number): string => {
	return toBase64Url(crypto.getRandomValues(new Uint8Array(length)));
};

export const generateState = (): string => {
	return randomBytes(16);
};

export const generateNonce = (): string => {
	return randomBytes(16);
};

export const generatePKCE = async (): Promise<{ verifier: string; challenge: string; method: string }> => {
	const verifier = randomBytes(32);

	return {
		verifier: verifier,
		challenge: await toSha256(verifier),
		method: 'S256',
	};
};
