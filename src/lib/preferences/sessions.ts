import type { AppBskyActorDefs, At } from '@atcute/client/lexicons';

export interface SessionPreferenceSchema {
	$version: 1;
	active: At.DID | undefined;
	accounts: AccountData[];
}

export interface AccountData {
	/** Account DID */
	readonly did: At.DID;
	profile: AppBskyActorDefs.ProfileViewDetailed;
}
