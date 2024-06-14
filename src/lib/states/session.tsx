import {
	batch,
	createContext,
	createEffect,
	createRoot,
	createSignal,
	untrack,
	useContext,
	type ParentProps,
} from 'solid-js';
import { unwrap } from 'solid-js/store';

import { BskyAuth, BskyMod, BskyXRPC, type AtpAccessJwt, type BskyAuthOptions } from '@mary/bluesky-client';
import type { At } from '@mary/bluesky-client/lexicons';
import { decodeJwt } from '@mary/bluesky-client/utils/jwt';

import { BLUESKY_MODERATION_DID } from '~/api/defaults';

import { globalEvents } from '~/globals/events';
import { sessions } from '~/globals/preferences';

import { makeAbortable } from '../hooks/abortable';
import type { PerAccountPreferenceSchema } from '../preferences/account';
import type { AccountData } from '../preferences/sessions';
import { createReactiveLocalStorage, isExternalWriting } from '../signals/storage';

import { assert } from '../invariant';

interface LoginOptions {
	service: string;
	identifier: string;
	password: string;
	authFactorToken?: string;
}

export interface CurrentAccountState {
	readonly did: At.DID;
	readonly data: AccountData;
	readonly preferences: PerAccountPreferenceSchema;

	readonly rpc: BskyXRPC;
	readonly auth: BskyAuth;
	readonly _cleanup: () => void;
}

export interface SessionContext {
	readonly currentAccount: CurrentAccountState | undefined;

	getAccounts(): AccountData[];
	resumeSession(account: AccountData): Promise<void>;
	removeAccount(account: AccountData): void;

	login(opts: LoginOptions): Promise<void>;
	logout(): void;
}

const Context = createContext<SessionContext>();

export const SessionProvider = (props: ParentProps) => {
	const [getSignal] = makeAbortable();
	const [state, _setState] = createSignal<CurrentAccountState>();

	const replaceState = (next: CurrentAccountState | undefined) => {
		_setState((prev) => {
			prev?._cleanup();
			return next;
		});
	};

	const createAccountState = (account: AccountData, rpc: BskyXRPC, auth: BskyAuth): CurrentAccountState => {
		return createRoot((cleanup): CurrentAccountState => {
			const preferences = createAccountPreferences(account.did);
			const mod = new BskyMod(rpc);

			createEffect(() => {
				const entries = Object.entries(preferences.moderation.labelers);
				mod.labelers = entries.map(([did, info]) => ({ did: did as At.DID, redact: info.redact }));
			});

			return {
				did: account.did,
				data: account,
				preferences: preferences,

				auth: auth,
				rpc: rpc,
				_cleanup: cleanup,
			};
		}, null);
	};

	const getAuthOptions = (): BskyAuthOptions => {
		return {
			onExpired() {
				globalEvents.emit('sessionexpired');
			},
			onRefresh(session) {
				const did = session.did;
				const existing = sessions.accounts.find((acc) => acc.did === did);

				if (existing) {
					batch(() => Object.assign(existing.session, session));
				}
			},
		};
	};

	const context: SessionContext = {
		get currentAccount() {
			return state();
		},

		getAccounts(): AccountData[] {
			return sessions.accounts;
		},
		async resumeSession(account: AccountData): Promise<void> {
			const signal = getSignal();
			const session = unwrap(account.session);

			const rpc = new BskyXRPC({ service: account.service });
			const auth = new BskyAuth(rpc, getAuthOptions());

			await auth.resume(session);
			signal.throwIfAborted();

			batch(() => {
				sessions.active = account.did;
				sessions.accounts = [account, ...sessions.accounts.filter((acc) => acc.did !== session.did)];
				replaceState(createAccountState(account, rpc, auth));
			});
		},
		removeAccount(account: AccountData): void {
			const $state = untrack(state);
			const isLoggedIn = $state !== undefined && $state.did === account.did;

			batch(() => {
				if (isLoggedIn) {
					replaceState(undefined);
				}
			});
		},

		async login(opts: LoginOptions): Promise<void> {
			const signal = getSignal();

			const rpc = new BskyXRPC({ service: opts.service });
			const auth = new BskyAuth(rpc, getAuthOptions());

			await auth.login({ identifier: opts.identifier, password: opts.password, code: opts.authFactorToken });
			signal.throwIfAborted();

			const session = auth.session!;
			const sessionJwt = decodeJwt(session.accessJwt) as AtpAccessJwt;

			const scope = sessionJwt.scope;
			let accountScope: AccountData['scope'];
			if (scope === 'com.atproto.appPass') {
				accountScope = 'limited';
			} else if (scope === 'com.atproto.appPassPrivileged') {
				accountScope = 'privileged';
			}

			const account: AccountData = {
				did: session.did,
				service: opts.service,
				session: session,
				scope: accountScope,
			};

			batch(() => {
				sessions.active = account.did;
				sessions.accounts = [account, ...sessions.accounts.filter((acc) => acc.did !== session.did)];
				replaceState(createAccountState(account, rpc, auth));
			});
		},
		logout(): void {
			const $state = untrack(state);
			if ($state !== undefined) {
				this.removeAccount($state.data);
			}
		},
	};

	createEffect(() => {
		const active = sessions.active;
		const activeAccount = active && sessions.accounts.find((acc) => acc.did === active);

		// Only run this on external changes
		if (isExternalWriting) {
			const untrackedState = untrack(state);

			if (active) {
				if (active !== untrackedState?.did) {
					// Current active account doesn't match what we have

					// Still logged in, so log out of this one
					if (untrackedState) {
						replaceState(undefined);
					}

					// Account data exists, try to login as that account
					if (activeAccount) {
						context.resumeSession(activeAccount);
					}
				} else if (activeAccount) {
					// It's likely that this external write occured due to session changes
					// so update it to whatever it is now
					untrackedState.auth.session = unwrap(activeAccount.session);
				}
			} else if (untrackedState) {
				// No active account yet we have a session, log out
				replaceState(undefined);
			}
		}
	});

	return <Context.Provider value={context}>{props.children}</Context.Provider>;
};

// Safe to destructure when under <AgentProvider>
export const useSession = (): SessionContext => {
	const session = useContext(Context);
	assert(session !== undefined, `Expected useSession to be called under <SessionProvider>`);

	return session;
};

const createAccountPreferences = (did: At.DID) => {
	const key = `account-${did}`;
	return createReactiveLocalStorage<PerAccountPreferenceSchema>(key, (version, prev) => {
		if (version === 0) {
			const obj: PerAccountPreferenceSchema = {
				$version: 1,
				feeds: [],
				language: {
					defaultPostLanguage: 'system',
				},
				moderation: {
					hideReposts: [],
					keywords: [],
					labelers: {
						[BLUESKY_MODERATION_DID]: {
							redact: true,
							privileged: false,
							labels: {},
						},
					},
					labels: {},
					tempMutes: {},
				},
			};

			return obj;
		}

		return prev;
	});
};
