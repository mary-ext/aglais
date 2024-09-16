import type { At } from '@atcute/client/lexicons';

export class TokenRefreshError extends Error {
	constructor(
		public readonly sub: At.DID,
		message: string,
		options?: ErrorOptions,
	) {
		super(message, options);
	}
}

export class TokenRevokedError extends Error {
	constructor(
		public readonly sub: At.DID,
		message: string = `session for ${sub} has been revoked`,
	) {
		super(message);
	}
}

export class TokenInvalidError extends Error {
	constructor(
		public readonly sub: At.DID,
		message = `invalid session for ${sub}`,
	) {
		super(message);
	}
}

export class OAuthResponseError extends Error {
	readonly error: string | undefined;
	readonly description: string | undefined;

	constructor(
		public readonly response: Response,
		public readonly data: any,
	) {
		const error = ifString(ifObject(data)?.['error']);
		const errorDescription = ifString(ifObject(data)?.['error_description']);

		const messageError = error ? `"${error}"` : 'unknown';
		const messageDesc = errorDescription ? `: ${errorDescription}` : '';
		const message = `OAuth ${messageError} error${messageDesc}`;

		super(message);

		this.error = error;
		this.description = errorDescription;
	}

	get status() {
		return this.response.status;
	}

	get headers() {
		return this.response.headers;
	}
}

export class FetchResponseError extends Error {
	constructor(
		public readonly response: Response,
		public status: number,
		message: string,
	) {
		super(message);
	}
}

const ifString = (v: unknown): string | undefined => {
	return typeof v === 'string' ? v : undefined;
};
const ifObject = (v: unknown): Record<string, unknown> | undefined => {
	return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as any) : undefined;
};
