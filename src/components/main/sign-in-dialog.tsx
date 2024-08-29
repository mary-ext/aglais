import { createSignal, Match, Switch } from 'solid-js';

import { createMutation } from '@mary/solid-query';

import { autofocusOnMutation } from '~/lib/input-refs';

import { OAuthServerAgent } from '~/lib/bsky-oauth/agents/server-agent';
import { createES256Key } from '~/lib/bsky-oauth/dpop';
import { CLIENT_ID, REDIRECT_URI, SCOPE } from '~/lib/bsky-oauth/env';
import { database } from '~/lib/bsky-oauth/globals';
import { resolveFromIdentity } from '~/lib/bsky-oauth/resolver';
import { generatePKCE, generateState } from '~/lib/bsky-oauth/utils';

import Button from '../button';
import * as Dialog from '../dialog';
import { Fieldset } from '../fieldset';
import InlineLink from '../inline-link';
import TextInput from '../text-input';

const enum View {
	HANDLE,
	PDS,
}

class LoginError extends Error {}

const SignInDialog = () => {
	const [view, setView] = createSignal(View.HANDLE);

	const [pending, setPending] = createSignal<string>();
	const [error, setError] = createSignal<string>();

	const loginMutation = createMutation(() => ({
		async mutationFn({ identifier }: { identifier: string }) {
			setPending(`Resolving your identity`);

			const { identity, metadata } = await resolveFromIdentity(identifier);

			if (!metadata.pushed_authorization_request_endpoint) {
				throw new LoginError(`no PAR endpoint is specified`);
			}

			setPending(`Contacting your data server`);

			const state = generateState();

			const pkce = await generatePKCE();
			const dpopKey = await createES256Key();

			const params = {
				redirect_uri: REDIRECT_URI,
				code_challenge: pkce.challenge,
				code_challenge_method: pkce.method,
				state: state,
				login_hint: identity ? identifier : undefined,
				response_mode: 'fragment',
				response_type: 'code',
				display: 'page',
				// id_token_hint: undefined,
				// max_age: undefined,
				// prompt: undefined,
				scope: SCOPE,
				// ui_locales: undefined,
			} satisfies Record<string, string | undefined>;

			await database.states.set(state, {
				dpopKey: dpopKey,
				issuer: metadata.issuer,
				verifier: pkce.verifier,
			});

			const server = new OAuthServerAgent(metadata, dpopKey);
			const response = await server.request('pushed_authorization_request', params);

			const authUrl = new URL(metadata.authorization_endpoint);
			authUrl.searchParams.set('client_id', CLIENT_ID);
			authUrl.searchParams.set('request_uri', response.request_uri);

			setPending(`Redirecting to your data server`);

			// Wait 250ms just in case.
			await new Promise((resolve) => setTimeout(resolve, 250));

			window.location.assign(authUrl);

			await new Promise((_resolve, reject) => {
				window.addEventListener(
					'pageshow',
					() => {
						reject(new LoginError(`User aborted the login request`));
					},
					{ once: true },
				);
			});
		},
		async onError(err) {
			console.error(err);
		},
	}));

	return (
		<>
			<Dialog.Backdrop />
			<Dialog.Container maxWidth="sm" centered disabled={loginMutation.isPending}>
				<form
					class="contents"
					onSubmit={(ev) => {
						const $view = view();
						const formData = new FormData(ev.currentTarget);

						ev.preventDefault();

						if ($view === View.HANDLE) {
							loginMutation.mutate({ identifier: formData.get('identifier') as string });
						} else {
						}
					}}
				>
					<Dialog.Header>
						<Dialog.HeaderAccessory>
							<Dialog.Close />
						</Dialog.HeaderAccessory>
					</Dialog.Header>

					<Fieldset disabled={loginMutation.isPending}>
						<Dialog.Body class="flex flex-col gap-6">
							<div class="flex flex-col gap-1">
								<h2 class="text-2xl font-bold">Sign in</h2>
								<h3 class="text-base text-contrast-muted">To begin, enter your Bluesky handle or DID</h3>
							</div>

							<div class="flex flex-col gap-4">
								<TextInput
									ref={(node) => {
										autofocusOnMutation(node, loginMutation);
									}}
									name="identifier"
									autocomplete="username"
									pattern="([a-zA-Z0-9\-]+(?:\.[a-zA-Z0-9\-]+)*(?:\.[a-zA-Z]+))|did:[a-z]+:[a-zA-Z0-9._:%\-]*[a-zA-Z0-9._\-]"
									required
									label="Bluesky handle or DID"
									placeholder="paul.bsky.social"
								/>

								<Switch>
									<Match when={loginMutation.isPending}>
										<p class="text-sm text-contrast-muted/80 empty:hidden">{pending()}</p>
									</Match>

									<Match when>
										<div class="flex flex-col gap-2">
											<InlineLink>Sign in with your personal data server instead</InlineLink>
										</div>
									</Match>
								</Switch>
							</div>
						</Dialog.Body>

						<Dialog.Actions>
							<Button type="submit" variant="primary" size="lg">
								Continue
							</Button>
						</Dialog.Actions>
					</Fieldset>
				</form>
			</Dialog.Container>
		</>
	);
};

export default SignInDialog;
