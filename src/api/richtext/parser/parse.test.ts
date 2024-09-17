import { describe, expect, it } from 'vitest';

import { parseRt } from './parse';

describe('parse', () => {
	it('handles escapes', () => {
		expect(
			parseRt(`hello cbsky.app/xrpc/app.cbsky.plc.getIndex?did=did\\:plc:ia76kvnndjutgedggx2ibrem`, false),
		).toMatchInlineSnapshot(`
			{
			  "empty": false,
			  "length": 80,
			  "links": [],
			  "segments": [
			    {
			      "raw": "hello cbsky.app/xrpc/app.cbsky.plc.getIndex?did=did",
			      "text": "hello cbsky.app/xrpc/app.cbsky.plc.getIndex?did=did",
			      "type": "text",
			    },
			    {
			      "raw": "\\",
			      "text": "",
			      "type": "escape",
			    },
			    {
			      "raw": ":",
			      "text": ":",
			      "type": "text",
			    },
			    {
			      "raw": "plc",
			      "text": "plc",
			      "type": "text",
			    },
			    {
			      "raw": ":ia76kvnndjutgedggx2ibrem",
			      "text": ":ia76kvnndjutgedggx2ibrem",
			      "type": "text",
			    },
			  ],
			  "source": "hello cbsky.app/xrpc/app.cbsky.plc.getIndex?did=did\\:plc:ia76kvnndjutgedggx2ibrem",
			  "text": "hello cbsky.app/xrpc/app.cbsky.plc.getIndex?did=did:plc:ia76kvnndjutgedggx2ibrem",
			}
		`);
	});
});
