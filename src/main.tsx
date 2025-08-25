/* @refresh reload */
import { type JSX, createSignal, onMount } from 'solid-js';
import { render } from 'solid-js/web';

import { Client, ok, simpleFetchHandler } from '@atcute/client';
import type { DidDocument } from '@atcute/identity';
import type { Did } from '@atcute/lexicons';
import { configureOAuth } from '@atcute/oauth-browser-client';

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
	const resolver = new Client({
		handler: simpleFetchHandler({ service: location.origin }),
	});

	configureOAuth({
		metadata: {
			client_id: import.meta.env.VITE_OAUTH_CLIENT_ID,
			redirect_uri: import.meta.env.VITE_OAUTH_REDIRECT_URL,
		},

		didDocumentResolver: {
			async resolve(did) {
				const data = await ok(
					resolver.get('com.atproto.identity.resolveDid', {
						params: {
							did: did,
						},
					}),
				);

				return data.didDoc as unknown as DidDocument;
			},
		},
		handleResolver: {
			async resolve(handle) {
				const data = await ok(
					resolver.get('com.atproto.identity.resolveHandle', {
						params: {
							handle: handle,
						},
					}),
				);

				return data.did as Did<'plc' | 'web'>;
			},
		},
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
