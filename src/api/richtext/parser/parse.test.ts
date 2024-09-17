import { describe, expect, it } from 'vitest';

import { parseRt } from './parse';

describe('parse', () => {
	it('handles escapes', () => {
		expect(
			parseRt(`hello cbsky.app/xrpc/app.cbsky.plc.getIndex?did=did\\:plc:ia76kvnndjutgedggx2ibrem`, false)
				.text,
		).toMatchInlineSnapshot(
			`"hello cbsky.app/xrpc/app.cbsky.plc.getIndex?did=did:plc:ia76kvnndjutgedggx2ibrem"`,
		);
	});

	it('handles mention succeeded by url', () => {
		expect(
			parseRt(
				`lol @mary.my.id
https://bsky.app/profile/did:plc:mn45tewwnse5btfftvd3powc/post/3l4bgf7ihdq2t`,
				false,
			).text,
		).toMatchInlineSnapshot(`
			"lol @mary.my.id
			bsky.app/profile/did:pl…"
		`);
	});
});
