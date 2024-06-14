/* @refresh reload */

import './styles/app.css';

import { createSignal, onMount, type JSX } from 'solid-js';
import { render } from 'solid-js/web';

import * as navigation from './globals/navigation';
import * as preferences from './globals/preferences';

import { memoizedOn } from './lib/misc';
import { configureRouter } from './lib/navigation/router';

import type { AccountData } from './lib/preferences/sessions';

import { AgentProvider } from './lib/states/agent';
import { ModerationProvider } from './lib/states/moderation';
import { SessionProvider, useSession } from './lib/states/session';
import { ThemeProvider } from './lib/states/theme';

import ModalRenderer from './components/main/modal-renderer';
import routes from './routes';
import Shell from './shell';

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
		const resumeAccount = async (account: AccountData | undefined) => {
			try {
				if (account) {
					await session.resumeSession(account);
				}
			} finally {
				setReady(true);
			}
		};

		{
			const { active, accounts } = preferences.sessions;
			const account = active && accounts.find((acc) => acc.did === active);

			resumeAccount(account);
		}
	});

	return memoizedOn(ready, ($ready) => {
		if (!$ready) {
			return;
		}

		return (
			<AgentProvider>
				{/* Anything under <AgentProvider> gets remounted on account changes */}
				<ModerationProvider>
					<Shell />
					<ModalRenderer />
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
