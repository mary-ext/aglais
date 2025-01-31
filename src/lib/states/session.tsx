import {
	type ParentProps,
	batch,
	createContext,
	createEffect,
	createMemo,
	createRoot,
	createSignal,
	untrack,
	useContext,
} from 'solid-js';

import { type FetchHandler, type FetchHandlerObject, XRPC, XRPCError } from '@atcute/client';
import type { At } from '@atcute/client/lexicons';
import { OAuthUserAgent, deleteStoredSession, getSession } from '@atcute/oauth-browser-client';
import { mapDefined } from '@mary/array-fns';

import { BLUESKY_MODERATION_DID } from '~/api/defaults';

import { sessions } from '~/globals/preferences';

import { type Labeler, attachLabelerHeaders } from '../atproto/labeler';
import { makeAbortable } from '../hooks/abortable';
import { createReactiveLocalStorage } from '../hooks/local-storage';
import type { PerAccountPreferenceSchema } from '../preferences/account';
import type { AccountData } from '../preferences/sessions';
import { assert } from '../utils/invariant';

export interface CurrentAccountState {
	readonly did: At.DID;
	readonly data: AccountData;
	readonly preferences: PerAccountPreferenceSchema;

	readonly rpc: XRPC;
	readonly agent: OAuthUserAgent | undefined;
	readonly _cleanup: () => void;
}

export interface SessionContext {
	readonly currentAccount: CurrentAccountState | undefined;

	getAccounts(): AccountData[];
	resumeSession(did: At.DID): Promise<void>;
	removeAccount(did: At.DID): Promise<void>;

	logout(): Promise<void>;
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

	const createAccountState = (
		did: At.DID,
		session: OAuthUserAgent | undefined,
		rpc: XRPC,
	): CurrentAccountState => {
		return createRoot((cleanup): CurrentAccountState => {
			const preferences = createAccountPreferences(did);

			const [abortable] = makeAbortable();

			const data = createMemo(() => {
				return sessions.accounts.find((acc) => acc.did === did);
			});

			const labelers = createMemo((): Labeler[] => {
				return Object.entries(preferences.moderation.labelers).map(([did, info]): Labeler => {
					return { did: did as At.DID, redact: info.redact };
				});
			});

			// A bit of a hack, but works right now.
			rpc.handle = attachLabelerHeaders(rpc.handle, labelers);

			createEffect(() => {
				const signal = abortable();

				const filters = preferences.moderation.keywords;

				const times = mapDefined(filters, (filter) => filter.expires);

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
				did: did,
				preferences: preferences,
				get data() {
					const $data = data();
					assert($data !== undefined);
					return $data;
				},

				rpc: rpc,
				agent: session,
				_cleanup: cleanup,
			};
		}, null);
	};

	const context: SessionContext = {
		get currentAccount() {
			return state();
		},

		getAccounts(): AccountData[] {
			return sessions.accounts;
		},
		async resumeSession(did: At.DID): Promise<void> {
			const account = sessions.accounts.find((acc) => acc.did === did);
			if (!account) {
				return;
			}

			// If we already have a session, reload...
			if (state()) {
				batch(() => {
					sessions.active = did;
					sessions.accounts = [account, ...sessions.accounts.filter((acc) => acc.did !== did)];

					location.reload();
				});

				return;
			}

			const signal = getSignal();

			let handler: FetchHandler | FetchHandlerObject;
			let agent: OAuthUserAgent | undefined;

			try {
				const session = await getSession(did, { allowStale: true });
				const expiresAt = session.token.expires_at;

				agent = new OAuthUserAgent(session);
				handler = agent;

				if (expiresAt !== undefined && expiresAt - Date.now() <= 5 * 60 * 1000) {
					agent.getSession({ noCache: true });
				}
			} catch {
				// Dirty hack to account for the fact that we aren't dumping the user
				// directly to the login modal.
				handler = () => {
					throw new XRPCError(400, { kind: 'invalid_token' });
				};
			}

			const rpc = new XRPC({ handler });

			signal.throwIfAborted();

			batch(() => {
				sessions.active = did;
				sessions.accounts = [account, ...sessions.accounts.filter((acc) => acc.did !== did)];

				replaceState(createAccountState(did, agent, rpc));
			});
		},

		async removeAccount(did: At.DID): Promise<void> {
			const $state = untrack(state);
			const isLoggedIn = $state !== undefined && $state.did === did;

			try {
				if (isLoggedIn) {
					const agent = $state.agent;
					await agent?.signOut();
				} else {
					const session = await getSession(did, { allowStale: true });
					const agent = new OAuthUserAgent(session);

					await agent.signOut();
				}
			} finally {
				deleteStoredSession(did);
			}

			batch(() => {
				if (sessions.active === did) {
					sessions.active = undefined;
				}

				sessions.accounts = sessions.accounts.filter((acc) => acc.did !== did);

				if (isLoggedIn) {
					location.reload();
				}
			});
		},
		async logout(): Promise<void> {
			const $state = untrack(state);
			if ($state !== undefined) {
				return context.removeAccount($state.did);
			}
		},
	};

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
				feeds: [
					{
						type: 'generator',
						pinned: false,
						info: {
							uri: 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot',
							cid: 'bafyreievgu2ty7qbiaaom5zhmkznsnajuzideek3lo7e65dwqlrvrxnmo4',
							did: 'did:web:discover.bsky.app',
							creator: {
								did: 'did:plc:z72i7hdynmk6r22z27h6tvur',
								handle: 'bsky.app',
								displayName: 'Bluesky',
							},
							displayName: 'Discover',
							description: 'Trending content from your personal network',
							avatar:
								'https://cdn.bsky.app/img/avatar/plain/did:plc:z72i7hdynmk6r22z27h6tvur/bafkreidljdg62x3zhlweyzshoekrw2znokytt5tmib7g4xsngwvpnf6ule@jpeg',
							labels: [],
							viewer: {},
							indexedAt: '2023-05-19T23:19:19.592Z',
						},
					},
				],
				ui: {
					mediaVolume: 0.25,
				},
				composer: {
					language: 'system',
					threadgate: {},
					postgate: {},
				},
				translation: {
					enabled: false,
					instances: [],
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
					treeView: false,
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
