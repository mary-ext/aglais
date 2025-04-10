import type { AppBskyActorDefs, At } from '@atcute/client/lexicons';

export interface SessionPreferenceSchema {
	$version: 1;
	active: At.Did | undefined;
	accounts: AccountData[];
}

export interface AccountData {
	/** Account DID */
	readonly did: At.Did;
	profile: AppBskyActorDefs.ProfileViewDetailed;
}
