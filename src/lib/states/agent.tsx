import { createContext, createMemo, useContext, type JSX, type ParentProps } from 'solid-js';

import { BskyXRPC, type BskyAuth } from '@mary/bluesky-client';
import { QueryClient, QueryClientProvider } from '@mary/solid-query';

import { assert } from '../invariant';
import { memoizedOn } from '../misc';
import { createQueryPersister } from '../utils/query-storage';

import { useSession } from './session';

export interface AgentContext {
	rpc: BskyXRPC;
	auth: BskyAuth | null;
	persister: ReturnType<typeof createQueryPersister>;
}

const Context = createContext<AgentContext>();

export const AgentProvider = (props: ParentProps) => {
	const session = useSession();

	const agent = createMemo((): AgentContext => {
		const currentAccount = session.currentAccount;

		if (currentAccount) {
			return {
				rpc: currentAccount.rpc,
				auth: currentAccount.auth,
				persister: createQueryPersister({ name: `queryCache-${currentAccount.did}` }),
			};
		}

		return {
			rpc: new BskyXRPC({ service: 'https://public.api.bsky.app' }),
			auth: null,
			persister: createQueryPersister({ name: `queryCache-public` }),
		};
	});

	return memoizedOn(agent, ($agent) => {
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
