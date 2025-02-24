import { type Token, tokenize } from '@atcute/bluesky-richtext-parser';

import { graphemeLen } from '~/api/utils/unicode';
import { toShortUrl } from '~/api/utils/url';

const RE_SILENT = /^\s*@silent(?:\s+|$)/;

export interface SilentToken {
	type: 'silent';
	text: string;
	raw: string;
}

export type RichTextToken = Token | SilentToken;

export interface ParsedRichText {
	tokens: RichTextToken[];
	length: number;
	empty: boolean;
	hasSilent: boolean;
}

const S_RE = /^\s+$/;

const reduceTokenLength = (accu: number, token: RichTextToken) => accu + graphemeLen(token.raw);

export const parseRichText = (input: string): ParsedRichText => {
	let silent: SilentToken | undefined;
	{
		const match = RE_SILENT.exec(input);
		if (match) {
			const text = match[0];
			silent = { type: 'silent', text, raw: '' };
			input = input.slice(text.length);
		}
	}

	let tokens: RichTextToken[] = tokenize(input);
	if (silent) {
		tokens = [silent, ...tokens];
	}

	for (let idx = 0, len = tokens.length; idx < len; idx++) {
		const token = tokens[idx];

		// we don't use the `raw` property much
		switch (token.type) {
			case 'autolink': {
				token.raw = toShortUrl(token.url);
				break;
			}
			case 'emote': {
				token.raw = '●';
				break;
			}
			case 'link': {
				token.raw = token.text;
				break;
			}
			case 'escape': {
				token.raw = token.escaped;
				break;
			}
		}
	}

	return {
		tokens: tokens,
		length: tokens.reduce(reduceTokenLength, 0),
		empty: input.length === 0 || S_RE.test(input),
		hasSilent: silent !== undefined,
	};
};
