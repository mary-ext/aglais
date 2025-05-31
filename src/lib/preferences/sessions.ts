import type { AppBskyActorDefs } from '@atcute/bluesky';
import type { Did } from '@atcute/lexicons';

export interface SessionPreferenceSchema {
	$version: 1;
	active: Did | undefined;
	accounts: AccountData[];
}

export interface AccountData {
	/** Account DID */
	readonly did: Did;
	profile: AppBskyActorDefs.ProfileViewDetailed;
}
