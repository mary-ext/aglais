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

import { XRPC } from '@atcute/client';
import type { At } from '@atcute/client/lexicons';
import { AtpAuth, type AtpAccessJwt, type AtpAuthOptions } from '@atcute/client/middlewares/auth';
import { AtpMod } from '@atcute/client/middlewares/mod';
import { decodeJwt } from '@atcute/client/utils/jwt';

import { BLUESKY_MODERATION_DID } from '~/api/defaults';

import { globalEvents } from '~/globals/events';
import { sessions } from '~/globals/preferences';

import { makeAbortable } from '../hooks/abortable';
import type { PerAccountPreferenceSchema } from '../preferences/account';
import type { AccountData } from '../preferences/sessions';
import { createReactiveLocalStorage, isExternalWriting } from '../signals/storage';

import { assert } from '../invariant';
import { mapDefined } from '../misc';

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

	readonly rpc: XRPC;
	readonly auth: AtpAuth;
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

	const createAccountState = (account: AccountData, rpc: XRPC, auth: AtpAuth): CurrentAccountState => {
		return createRoot((cleanup): CurrentAccountState => {
			const preferences = createAccountPreferences(account.did);
			const mod = new AtpMod(rpc);

			const [abortable] = makeAbortable();

			createEffect(() => {
				const entries = Object.entries(preferences.moderation.labelers);
				mod.labelers = entries.map(([did, info]) => ({ did: did as At.DID, redact: info.redact }));
			});

			createEffect(() => {
				const signal = abortable();

				const filters = preferences.moderation.keywords;

				const times = [...mapDefined(filters, (filter) => filter.expires)];

				const nextAt = times.reduce((time, x) => (x < time ? x : time), Infinity);

				if (nextAt === Infinity) {
					return;
				}

				const run = () => {
					const now = Date.now();

					// Check if we've not yet reached the desired timeout,
					// see the note on sleep function for why
					if (now < nextAt) {
						sleep(nextAt - now, signal).then(run);
						return;
					}

					batch(() => {
						for (const filter of filters) {
							const expires = filter.expires;

							if (expires !== undefined && expires <= now) {
								filter.pref = 1;
								filter.expires = undefined;
							}
						}
					});
				};

				sleep(nextAt - Date.now(), signal).then(run);
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

	const getAuthOptions = (): AtpAuthOptions => {
		return {
			onExpired() {
				globalEvents.emit('sessionexpired');
			},
			onSessionUpdate(session) {
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

			const rpc = new XRPC({ service: account.service });
			const auth = new AtpAuth(rpc, getAuthOptions());

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

			const rpc = new XRPC({ service: opts.service });
			const auth = new AtpAuth(rpc, getAuthOptions());

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
				composer: {
					defaultPostLanguage: 'system',
					defaultReplyGate: 'everyone',
				},
				translation: {
					enabled: false,
					proxy: true,
					to: 'system',
					exclusions: [],
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
				},
				threadView: {
					followsFirst: true,
					sort: 'clout',
					treeView: true,
				},
			};

			return obj;
		}

		return prev;
	});
};

const sleep = (ms: number, signal?: AbortSignal): Promise<void> => {
	return new Promise((resolve) => {
		if (signal?.aborted) {
			return;
		}

		if (ms < 1) {
			return resolve();
		}

		// 2 ** 31 - 1 miliseconds, or ~24.8 days, is the maximum delay value,
		// anything beyond that will wrap around and makes the sleep callback
		// run immediately.
		const clamped = Math.min(ms, 2 ** 31 - 1);
		const c = () => clearTimeout(timeout);

		const timeout = setTimeout(() => {
			signal?.removeEventListener('abort', c);
			resolve();
		}, clamped);

		signal?.addEventListener('abort', c, { once: true });
	});
};
