import { Match, Switch, createResource } from 'solid-js';

import { OAuthServerAgent } from '~/api/oauth/agents/server-agent';
import { sessions } from '~/api/oauth/agents/sessions';
import { OAuthUserAgent } from '~/api/oauth/agents/user-agent';
import { getMetadataFromAuthorizationServer } from '~/api/oauth/resolver';
import type { Session } from '~/api/oauth/types/token';

import { database } from '~/globals/oauth-db';
import * as preferences from '~/globals/preferences';

import Button from '~/components/button';
import CircularProgress from '~/components/circular-progress';

class AuthorizationError extends Error {
	name = 'AuthorizationError';
}

const OAuthCallbackPage = () => {
	const [resource] = createResource(async () => {
		const searchParams = new URLSearchParams(location.hash.slice(1));

		// @todo: Store the path that the user was previously in

		// We've captured the search params, we don't want this to be replayed.
		// Do this on global history instance so it doesn't affect this page rendering.
		history.replaceState(null, '', '/');

		const raw_issuer = searchParams.get('iss');
		const state = searchParams.get('state');
		const code = searchParams.get('code');
		const error = searchParams.get('error');

		if (!state || !(code || error)) {
			throw new Error(`missing parameters`);
		}

		const stored = await database.states.get(state);
		if (stored) {
			// Delete now that we've caught it
			await database.states.delete(state);
		} else {
			throw new Error(`unknown state`);
		}

		if (error) {
			throw new AuthorizationError(searchParams.get('error_description') || error);
		}
		if (!code) {
			throw new Error(`missing code parameter`);
		}

		// Retrieve server metadata
		const as_meta = await getMetadataFromAuthorizationServer(stored.issuer);
		const issuer = as_meta.issuer;

		if (raw_issuer !== null) {
			if (issuer !== raw_issuer) {
				throw new Error(`issuer mismatch`);
			}
		} else if (as_meta.authorization_response_iss_parameter_supported) {
			throw new Error(`expected server to provide iss parameter`);
		}

		// Retrieve authentication tokens
		const dpopKey = stored.dpopKey;

		const server = new OAuthServerAgent(as_meta, dpopKey);
		const { info, token } = await server.exchangeCode(code, stored.verifier);

		// We're finished!
		const sub = info.sub;
		const session: Session = { dpopKey, info, token };

		await sessions.setStored(sub, session);

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

			ui.active = sub;
			ui.accounts = [{ did: sub }, ...ui.accounts.filter((acc) => acc.did !== sub)];

			// Reload, we've routed the user back to `/` earlier.
			location.reload();
		}
	});

	return (
		<Switch>
			<Match when={resource.error}>
				<div class="flex grow flex-col items-center justify-center gap-6">
					<div class="text-sm">
						<p class="text-p-red-400">Authentication failed</p>
						<p class="text-contrast-muted">{'' + resource.error}</p>
					</div>
					<Button onClick={() => location.reload()} variant="primary" size="md">
						Go home
					</Button>
				</div>
			</Match>

			<Match when>
				<div class="flex grow flex-col items-center justify-center gap-6">
					<p class="text-sm text-contrast-muted">Processing your sign in information</p>
					<CircularProgress />
				</div>
			</Match>
		</Switch>
	);
};

export default OAuthCallbackPage;
