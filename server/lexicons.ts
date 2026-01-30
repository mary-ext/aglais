import type {} from '@atcute/lexicons/ambient';
import * as v from '@atcute/lexicons/validations';

export const requestAssertionSchema = v.procedure('x.aglais.requestAssertion', {
	params: null,
	input: {
		type: 'lex',
		schema: v.object({
			aud: v.string(),
		}),
	},
	output: {
		type: 'lex',
		schema: v.object({
			assertion: v.string(),
		}),
	},
});

export const resolveIdentitySchema = v.query('x.aglais.resolveIdentity', {
	params: v.object({
		identifier: v.actorIdentifierString(),
	}),
	output: {
		type: 'lex',
		schema: v.object({
			did: v.didString(),
			handle: v.handleString(),
			pds: v.genericUriString(),
		}),
	},
});

declare module '@atcute/lexicons/ambient' {
	interface XRPCProcedures {
		'x.aglais.requestAssertion': typeof requestAssertionSchema;
	}

	interface XRPCQueries {
		'x.aglais.resolveIdentity': typeof resolveIdentitySchema;
	}
}
