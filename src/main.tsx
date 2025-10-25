/* @refresh reload */
import { type JSX, createSignal, onMount } from 'solid-js';
import { render } from 'solid-js/web';

import type { Did, Handle } from '@atcute/lexicons';
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
	configureOAuth({
		metadata: {
			client_id: import.meta.env.VITE_OAUTH_CLIENT_ID,
			redirect_uri: import.meta.env.VITE_OAUTH_REDIRECT_URL,
		},

		identityResolver: {
			async resolve(actor) {
				const url = new URL('https://slingshot.microcosm.blue/xrpc/com.bad-example.identity.resolveMiniDoc');
				url.searchParams.set('identifier', actor);

				const response = await fetch(url);
				if (!response.ok) {
					throw new Error(`resolver responded with status ${response.status}`);
				}

				const json = (await response.json()) as {
					did: Did;
					handle: Handle;
					pds: string;
					signing_key: string;
				};

				return {
					did: json.did,
					handle: json.handle,
					pds: json.pds,
				};
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
