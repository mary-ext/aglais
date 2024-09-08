/* @refresh reload */
import { type JSX, createSignal, onMount } from 'solid-js';
import { render } from 'solid-js/web';

import type { At } from '@atcute/client/lexicons';

import * as navigation from '~/globals/navigation';
import * as preferences from '~/globals/preferences';

import { configureRouter } from '~/lib/navigation/router';
import { AgentProvider } from '~/lib/states/agent';
import { BookmarksProvider } from '~/lib/states/bookmarks';
import { ModerationProvider } from '~/lib/states/moderation';
import { SessionProvider, useSession } from '~/lib/states/session';
import { ThemeProvider } from '~/lib/states/theme';
import { on } from '~/lib/utils/misc';

import ModalRenderer from '~/components/main/modal-renderer';

import routes from './routes';
import Shell from './shell';

import './styles/app.css';

// Configure routing
configureRouter({
	history: navigation.history,
	logger: navigation.logger,
	routes: routes,
});

const InnerApp = () => {
	const [ready, setReady] = createSignal(false);
	const session = useSession();

	onMount(() => {
		const resumeAccount = async (did: At.DID | undefined) => {
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
			return;
		}

		return (
			<AgentProvider>
				{/* Anything under <AgentProvider> gets remounted on account changes */}
				<ModerationProvider>
					<BookmarksProvider>
						<Shell />
						<ModalRenderer />
					</BookmarksProvider>
				</ModerationProvider>
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

// Render the app
render(App, document.body);
