import type { At } from '@atcute/client/lexicons';
import type { AtpSessionData } from '@atcute/client/middlewares/auth';

export interface SessionPreferenceSchema {
	$version: 1;
	active: At.DID | undefined;
	accounts: AccountData[];
}

export interface AccountData {
	/** Account DID */
	readonly did: At.DID;
	/** Account's PDS or entryway (bsky.social instances) */
	service: string;
	/** Account's session data, from `BskyAuth` */
	session: AtpSessionData;
	/** Whether an account has a defined scope, from app passwords. */
	scope: 'limited' | 'privileged' | undefined;
}
