import type { AtpSessionData } from '@mary/bluesky-client';
import type { At } from '@mary/bluesky-client/lexicons';

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
