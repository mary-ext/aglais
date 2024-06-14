// This isn't a real property, but it prevents T being compatible with Shadow<T>.
declare const IsShadow: unique symbol;

export type Shadow<T> = T & { [IsShadow]: true };

export const castAsShadow = <T>(value: T): Shadow<T> => {
	return value as any as Shadow<T>;
};

export interface PostCacheFindOptions {
	uri?: string;
	rootUri?: string;
	includeQuote?: boolean;
}
