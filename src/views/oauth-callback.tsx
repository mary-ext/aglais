import { Match, Switch, createResource } from 'solid-js';

import {
	AuthorizationError,
	OAuthResponseError,
	OAuthUserAgent,
	finalizeAuthorization,
} from '@atcute/oauth-browser-client';

import * as preferences from '~/globals/preferences';

import Button from '~/components/button';
import CircularProgress from '~/components/circular-progress';

const OAuthCallbackPage = () => {
	const [resource] = createResource(async () => {
		const params = new URLSearchParams(location.hash.slice(1));

		// We've captured the search params, we don't want this to be replayed.
		// Do this on global history instance so it doesn't affect this page rendering.
		history.replaceState(null, '', '/');

		const session = await finalizeAuthorization(params);
		const did = session.info.sub;

		// We make 4 requests right at the start of the app's launch, those requests
		// will fail immediately on bsky.social as they'd be missing a DPoP nonce,
		// so let's fire a random request right now.
		try {
			const agent = new OAuthUserAgent(session);
			await agent.handle(`/xrpc/app.bsky.notification.getUnreadCount`);
		} catch {
			// Don't worry about it failing.
		}

		{
			// Update UI preferences
			const ui = preferences.sessions;

			ui.active = did;
			ui.accounts = [{ did: did }, ...ui.accounts.filter((acc) => acc.did !== did)];

			// Reload, we've routed the user back to `/` earlier.
			location.reload();
		}
	});

	return (
		<Switch>
			<Match when={resource.error}>
				{(error) => (
					<div class="mx-auto flex max-w-sm grow flex-col items-center justify-center gap-6 p-6">
						<div class="text-sm">
							<p class="text-p-red-400">Authentication failed</p>
							<p class="text-contrast-muted">
								{(() => {
									const $error = error();

									if ($error instanceof OAuthResponseError) {
										return $error.description || $error.message;
									}
									if ($error instanceof AuthorizationError) {
										return $error.message;
									}

									return '' + $error;
								})()}
							</p>
						</div>
						<Button onClick={() => location.reload()} variant="primary" size="md">
							Go home
						</Button>
					</div>
				)}
			</Match>

			<Match when>
				<div class="mx-auto flex max-w-sm grow flex-col items-center justify-center gap-6 p-6">
					<p class="text-sm text-contrast-muted">Processing your sign in information</p>
					<CircularProgress />
				</div>
			</Match>
		</Switch>
	);
};

export default OAuthCallbackPage;
