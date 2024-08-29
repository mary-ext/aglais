import { createOAuthDatabase } from './store/db';

export const database = createOAuthDatabase({ name: 'aglais-oauth' });
