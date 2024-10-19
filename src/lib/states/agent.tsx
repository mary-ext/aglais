import { type JSX, type ParentProps, createContext, createMemo, useContext } from 'solid-js';

import { XRPC, simpleFetchHandler } from '@atcute/client';
import type { At } from '@atcute/client/lexicons';
import type { OAuthUserAgent } from '@atcute/oauth-browser-client';
import { QueryClient, QueryClientProvider } from '@mary/solid-query';

import { DEFAULT_APPVIEW_URL } from '~/api/defaults';

import { createQueryPersister } from '../hooks/query-storage';
import { assert } from '../utils/invariant';
import { on } from '../utils/misc';

import { useSession } from './session';

export interface AgentContext {
	did: At.DID | null;
	rpc: XRPC;
	handler: OAuthUserAgent | null;
	persister: ReturnType<typeof createQueryPersister>;
}

const Context = createContext<AgentContext>();

export const AgentProvider = (props: ParentProps) => {
	const session = useSession();

	const agent = createMemo((): AgentContext => {
		const currentAccount = session.currentAccount;

		if (currentAccount) {
			return {
				did: currentAccount.did,
				handler: currentAccount.agent ?? null,
				rpc: currentAccount.rpc,
				persister: createQueryPersister({ name: `queryCache-${currentAccount.did}` }),
			};
		}

		return {
			did: null,
			handler: null,
			rpc: new XRPC({ handler: simpleFetchHandler({ service: DEFAULT_APPVIEW_URL }) }),
			persister: createQueryPersister({ name: `queryCache-public` }),
		};
	});

	return on(agent, ($agent) => {
		// Always use a new QueryClient when the agent changes,
		// this way we don't need to manually reset on switching accounts.
		const queryClient = new QueryClient({
			defaultOptions: {
				queries: {
					gcTime: 2_000,
					staleTime: 30_000,
					refetchOnReconnect: false,
					refetchOnWindowFocus: false,
					retry: false,
				},
			},
		});

		return (
			<QueryClientProvider client={queryClient}>
				<Context.Provider value={$agent}>{props.children}</Context.Provider>
			</QueryClientProvider>
		);
	}) as unknown as JSX.Element;
};

// Safe to destructure when under <AgentProvider>
export const useAgent = (): AgentContext => {
	const agent = useContext(Context);
	assert(agent !== undefined, `Expected useAgent to be called under <AgentProvider>`);

	return agent;
};
