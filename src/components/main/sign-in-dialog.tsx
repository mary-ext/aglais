import { Match, Switch, createSignal, onMount } from 'solid-js';

import {
	type AuthorizationServerMetadata,
	type IdentityMetadata,
	OAuthResponseError,
	ResolverError,
	createAuthorizationUrl,
	resolveFromIdentity,
	resolveFromService,
} from '@atcute/oauth-browser-client';
import { createMutation } from '@mary/solid-query';

import { autofocusOnMutation } from '~/lib/input-refs';
import { assert } from '~/lib/utils/invariant';

import Button from '../button';
import * as Dialog from '../dialog';
import { Fieldset } from '../fieldset';
import InlineLink from '../inline-link';
import TextInput from '../text-input';

const enum View {
	HANDLE,
	PDS,
}

export interface SignInDialogProps {
	autologin?: string;
}

const SignInDialog = (props: SignInDialogProps) => {
	const [view, setView] = createSignal(View.HANDLE);

	const [pending, setPending] = createSignal<string>();
	const [error, setError] = createSignal<string>();

	const autologin = props.autologin;

	const loginMutation = createMutation(() => ({
		async mutationFn({ identifier, pds }: { identifier?: string; pds?: string }) {
			setPending(`Resolving your identity`);

			let metadata: AuthorizationServerMetadata;
			let identity: IdentityMetadata | undefined;

			if (identifier) {
				({ metadata, identity } = await resolveFromIdentity(identifier));
			} else if (pds) {
				({ metadata } = await resolveFromService(pds));
			} else {
				assert(false);
			}

			setPending(`Contacting your data server`);

			const authUrl = await createAuthorizationUrl({
				metadata: metadata,
				identity: identity,
				scope: import.meta.env.VITE_OAUTH_SCOPE,
			});

			setPending(`Redirecting to authorization page`);

			// Wait for a moment to let the browser persist the local storage
			await new Promise((resolve) => setTimeout(resolve, 200));

			window.location.assign(authUrl);

			await new Promise((_resolve, reject) => {
				const listener = () => {
					reject(new Error(`user aborted the login request`));
				};

				window.addEventListener('pageshow', listener, { once: true });
			});
		},
		async onError(err) {
			let msg = `Something went wrong, try again later.`;

			if (err instanceof ResolverError) {
				msg = `Failed to resolve your identity, please double check or try again later.`;
			} else if (err instanceof OAuthResponseError && err.error) {
				msg = `Authorization server responded with "${err.error}"`;
			}

			console.error(err);
			setError(msg);
		},
	}));

	if (autologin) {
		loginMutation.mutate({ identifier: autologin });
	}

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
						setError();

						console.log(formData);

						if ($view === View.HANDLE) {
							loginMutation.mutate({ identifier: formData.get('identifier') as string });
						} else {
							loginMutation.mutate({ pds: `https://` + formData.get('pds')! });
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
								<h3 class="text-base text-contrast-muted">
									{view() === View.HANDLE
										? `To begin, enter your Bluesky handle or DID`
										: `To begin, enter the domain to your PDS`}
								</h3>
							</div>

							<div class="flex flex-col gap-4">
								<Switch>
									<Match when={view() === View.HANDLE}>
										<TextInput
											ref={(node) => {
												autofocusOnMutation(node, loginMutation);

												if (autologin) {
													onMount(() => {
														node.value = autologin;
													});
												}
											}}
											name="identifier"
											autocomplete="username"
											pattern="([a-zA-Z0-9\-]+(?:\.[a-zA-Z0-9\-]+)*(?:\.[a-zA-Z]+))|did:[a-z]+:[a-zA-Z0-9._:%\-]*[a-zA-Z0-9._\-]"
											required
											label="Bluesky handle or DID"
											placeholder="paul.bsky.social"
										/>

										<div class="flex flex-col gap-2">
											<InlineLink onClick={() => setView(View.PDS)}>
												Sign in with your personal data server instead
											</InlineLink>
										</div>
									</Match>

									<Match when={view() === View.PDS}>
										<TextInput
											ref={(node) => {
												autofocusOnMutation(node, loginMutation);
											}}
											name="pds"
											pattern="([a-zA-Z0-9\-]+(?:\.[a-zA-Z0-9\-]+)*(?:\.[a-zA-Z]+))"
											required
											label="PDS domain"
											placeholder="bsky.social"
										/>

										<div class="flex flex-col gap-2">
											<InlineLink onClick={() => setView(View.HANDLE)}>
												Sign in with your handle instead
											</InlineLink>
										</div>
									</Match>
								</Switch>

								<Switch>
									<Match when={loginMutation.isPending}>
										<p class="text-sm text-contrast-muted/80 empty:hidden">{pending()}</p>
									</Match>

									<Match when={error() !== undefined}>
										<p class="text-sm text-p-red-400 empty:hidden">{error()}</p>
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
