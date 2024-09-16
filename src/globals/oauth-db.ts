import { createOAuthDatabase } from '../api/oauth/store/db';

export const database = createOAuthDatabase({ name: 'oauth' });
