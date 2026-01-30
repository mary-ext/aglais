/* @refresh reload */
import { type JSX, createSignal, onMount } from 'solid-js';
import { render } from 'solid-js/web';

import { Client, ok, simpleFetchHandler } from '@atcute/client';
import type { Did } from '@atcute/lexicons';
import { type ClientAssertionFetcher, configureOAuth } from '@atcute/oauth-browser-client';

import * as navigation from '~/globals/navigation';
import * as preferences from '~/globals/preferences';

import { configureRouter } from '~/lib/navigation/router';
import { AgentProvider } from '~/lib/states/agent';
import { SessionProvider, useSession } from '~/lib/states/session';
import { SingletonProvider } from '~/lib/states/singleton';
import { ThemeProvider } from '~/lib/states/theme';
import { on } from '~/lib/utils/misc';

import CircularProgress from '~/components/circular-progress';
import ModalRenderer from '~/components/main/modal-renderer';

import type {} from '../server/lexicons';

import routes from './routes';
import './service-worker';
import Shell from './shell';

import './styles/app.css';

// Configure routing
configureRouter({
	history: navigation.history,
	logger: navigation.logger,
	routes: routes,
});

// Configure OAuth
{
	// Development mode uses public client with http://localhost client ID
	// Production mode uses confidential client with server-side JWT assertions
	const isPublicClient = !!import.meta.env.VITE_OAUTH_CLIENT_ID;

	const host = new Client({
		handler: simpleFetchHandler({ service: location.origin }),
	});

	const fetchClientAssertion: ClientAssertionFetcher = async ({ aud, createDpopProof }) => {
		const dpop = await createDpopProof(`${location.origin}/xrpc/x.aglais.requestAssertion`);

		const data = await ok(
			host.post('x.aglais.requestAssertion', {
				input: {
					aud: aud,
				},
				headers: {
					dpop: dpop,
				},
			}),
		);

		return {
			client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
			client_assertion: data.assertion,
		};
	};

	configureOAuth({
		metadata: {
			client_id: isPublicClient
				? import.meta.env.VITE_OAUTH_CLIENT_ID
				: `${location.origin}/oauth-client-metadata.json`,
			redirect_uri: isPublicClient
				? import.meta.env.VITE_OAUTH_REDIRECT_URL
				: `${location.origin}/oauth/callback`,
		},

		identityResolver: {
			async resolve(actor) {
				const data = await ok(
					host.get('x.aglais.resolveIdentity', {
						params: {
							identifier: actor,
						},
					}),
				);

				return data;
			},
		},

		fetchClientAssertion: isPublicClient ? undefined : fetchClientAssertion,
	});
}

const InnerApp = () => {
	const [ready, setReady] = createSignal(false);
	const session = useSession();

	onMount(() => {
		const resumeAccount = async (did: Did | undefined) => {
			try {
				if (did) {
					await session.resumeSession(did);
				}
			} finally {
				setReady(true);
			}
		};

		{
			resumeAccount(preferences.sessions.active);
		}
	});

	return on(ready, ($ready) => {
		if (!$ready) {
			return (
				<div class="grid min-h-dvh place-items-center">
					<CircularProgress />
				</div>
			);
		}

		return (
			<AgentProvider>
				{/* Anything under <AgentProvider> gets remounted on account changes */}
				<SingletonProvider>
					<Shell />
					<ModalRenderer />
				</SingletonProvider>
			</AgentProvider>
		);
	}) as unknown as JSX.Element;
};

const App = () => {
	return (
		<ThemeProvider>
			<SessionProvider>
				<InnerApp />
			</SessionProvider>
		</ThemeProvider>
	);
};

history.scrollRestoration = 'manual';

// Render the app
render(App, document.body);
