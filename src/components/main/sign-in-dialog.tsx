import { Match, Switch, batch, createSignal } from 'solid-js';

import { XRPCError } from '@atcute/client';
import { createMutation } from '@mary/solid-query';

import { DEFAULT_DATA_SERVER } from '~/api/defaults';
import type { DataServer } from '~/api/types';
import { DidResolutionError, findDidDocument, getDataServer } from '~/api/utils/did-doc';
import { isDid } from '~/api/utils/strings';

import { closeAllModals } from '~/globals/modals';

import { autofocusNode, autofocusOnMutation, modelText } from '~/lib/input-refs';
import { useSession } from '~/lib/states/session';

import Button from '../button';
import * as Dialog from '../dialog';
import { Fieldset } from '../fieldset';
import InlineLink from '../inline-link';
import TextInput from '../text-input';

type View =
	| { type: 'handle_initial' }
	| { type: 'handle_password' }
	| { type: 'email_initial' }
	| { type: 'otp'; from: 'handle' | 'email' };

type TargetedError = { target: 'identifier' | 'password' | 'otp'; msg: string };

const SignInDialog = () => {
	const session = useSession();

	const [view, setView] = createSignal<View>({ type: 'handle_initial' });

	const [service, setService] = createSignal(DEFAULT_DATA_SERVER);
	const [identifier, setIdentifier] = createSignal('');
	const [password, setPassword] = createSignal('');
	const [otp, setOtp] = createSignal('');

	const [error, setError] = createSignal<TargetedError>();

	const pdsMutation = createMutation(() => {
		return {
			async mutationFn({ identifier }: { identifier: string }) {
				const didDoc = await findDidDocument(identifier);
				const service = getDataServer(didDoc);
				if (!service) {
					throw new Error(`PDS_NOT_FOUND`);
				}

				return { didDoc, service };
			},
			onSuccess({ service }) {
				setTimeout(() => {
					batch(() => {
						setView({ type: 'handle_password' });
						setService(service);
					});
				}, 0);
			},
			onError(error, { identifier }) {
				let msg = `Unknown error, try again later`;

				if (error instanceof DidResolutionError) {
					const type = error.message;

					if (type === 'DID_UNSUPPORTED') {
						if (isDid(identifier)) {
							msg = `Unsupported DID method`;
						} else {
							msg = `Account uses an unsupported DID method`;
						}
					} else if (type === 'PLC_NOT_FOUND') {
						msg = `DID not found in PLC directory`;
					} else if (type === 'PLC_UNREACHABLE') {
						msg = `Can't reach PLC directory right now, try again later`;
					} else if (type === 'WEB_INVALID') {
						msg = `Specified did:web is invalid`;
					} else if (type === 'WEB_NOT_FOUND') {
						msg = `Can't find your account, did you type it correctly?`;
					} else if (type === 'WEB_UNREACHABLE') {
						msg = `Can't reach your DID document right now, try again later`;
					}
				} else if (error instanceof XRPCError) {
					const err = error.kind;

					if (error.message === 'Unable to resolve handle') {
						msg = `Can't find your account, did you type it correctly?`;
					} else if (err === 'InvalidRequest') {
						msg = `That doesn't seem right, did you type it correctly?`;
					}
				} else if (error instanceof Error) {
					if (error.message === 'PDS_NOT_FOUND') {
						msg = `Account is not attached to a hosting provider`;
					}
				}

				setError({ target: 'identifier', msg });
			},
		};
	});

	const loginMutation = createMutation(() => ({
		async mutationFn({
			service,
			identifier,
			password,
			authFactorToken,
		}: {
			from: 'handle' | 'email';
			service: DataServer;
			identifier: string;
			password: string;
			authFactorToken: string | undefined;
		}) {
			await session.login({
				service: service.uri,
				identifier: identifier,
				password: password,
				authFactorToken: authFactorToken,
			});
		},
		onSuccess() {
			closeAllModals();
		},
		onError(error: unknown, { from }) {
			let msg = `Unknown error, try again later`;

			if (error instanceof XRPCError) {
				const err = error.kind;

				if (err === 'AuthFactorTokenRequired') {
					setView({ type: 'otp', from: from });
					return;
				} else if (err === 'AuthenticationRequired') {
					msg = `Invalid password`;
				} else if (err === 'AccountTakedown') {
					msg = `Your account has been taken down`;
				}
			} else if (error instanceof DOMException) {
				if (error.name === 'AbortError') {
					msg = `Login attempt aborted, try again`;
				}
			}

			setError({ target: 'password', msg });
		},
	}));

	return (
		<>
			<Dialog.Backdrop />
			<Dialog.Container maxWidth="sm" centered disabled={loginMutation.isPending}>
				<form
					class="contents"
					onsubmit={(ev) => {
						const $view = view();

						ev.preventDefault();

						batch(() => {
							setError(undefined);

							if ($view.type === 'handle_initial') {
								pdsMutation.mutate({ identifier: identifier() });
							} else if ($view.type === 'handle_password') {
								loginMutation.mutate({
									from: 'handle',
									service: service(),
									identifier: identifier(),
									password: password(),
									authFactorToken: undefined,
								});
							} else if ($view.type === 'email_initial') {
								loginMutation.mutate({
									from: 'email',
									service: service(),
									identifier: identifier(),
									password: password(),
									authFactorToken: undefined,
								});
							} else if ($view.type === 'otp') {
								loginMutation.mutate({
									from: $view.from,
									service: service(),
									identifier: identifier(),
									password: password(),
									authFactorToken: formatEmailOtpCode(otp()),
								});
							}
						});
					}}
				>
					<Dialog.Header>
						<Dialog.HeaderAccessory>
							<Dialog.Close />
						</Dialog.HeaderAccessory>
					</Dialog.Header>

					<Fieldset disabled={pdsMutation.isPending}>
						<Dialog.Body class="flex flex-col gap-6">
							<Switch>
								<Match when={view().type === 'handle_initial'}>
									<div class="flex flex-col gap-1">
										<h2 class="text-2xl font-bold">Sign in</h2>
										<h3 class="text-base text-contrast-muted">To begin, enter your Bluesky handle or DID</h3>
									</div>

									<div class="flex flex-col gap-4">
										<TextInput
											ref={(node) => {
												autofocusOnMutation(node, pdsMutation);
												modelText(node, identifier, setIdentifier);
											}}
											autocomplete="username"
											pattern="([a-zA-Z0-9\-]+(?:\.[a-zA-Z0-9\-]+)*(?:\.[a-zA-Z]+))|did:[a-z]+:[a-zA-Z0-9._\-]+"
											required
											label="Bluesky handle or DID"
											placeholder="paul.bsky.social"
											error={(() => {
												const $error = error();
												if ($error && $error.target === 'identifier') {
													return $error.msg;
												}
											})()}
										/>

										<input
											ref={(node) => {
												modelText(node, password, setPassword);
											}}
											type="password"
											autocomplete="current-password"
											hidden
										/>

										<div class="flex flex-col gap-2">
											<InlineLink
												onClick={() => {
													batch(() => {
														setView({ type: 'email_initial' });

														setError();

														setService(DEFAULT_DATA_SERVER);
														setIdentifier('');
														setPassword('');
													});
												}}
											>
												Sign in with email address instead
											</InlineLink>
										</div>
									</div>
								</Match>

								<Match when={view().type === 'handle_password'}>
									<div class="flex flex-col gap-1">
										<h2 class="text-2xl font-bold">Enter your password</h2>
									</div>

									<div class="flex flex-col gap-4">
										<TextInput
											disabled
											autocomplete="username"
											label="Bluesky handle or DID"
											value={identifier()}
										/>

										<TextInput
											ref={(node) => {
												autofocusOnMutation(node, loginMutation);
												modelText(node, password, setPassword);
											}}
											type="password"
											autocomplete="current-password"
											required
											label="Password"
											error={(() => {
												const $error = error();
												if ($error && $error.target === 'password') {
													return $error.msg;
												}
											})()}
										/>

										<div class="flex flex-col gap-2">
											<InlineLink
												onClick={() => {
													batch(() => {
														setView({ type: 'handle_initial' });

														setError();
														setPassword('');
													});
												}}
											>
												Sign in with another account
											</InlineLink>
										</div>
									</div>
								</Match>

								<Match when={view().type === 'email_initial'}>
									<div class="flex flex-col gap-1">
										<h2 class="text-2xl font-bold">Sign in</h2>
									</div>

									<div class="flex flex-col gap-4">
										<TextInput
											ref={(node) => {
												autofocusNode(node);
												modelText(node, identifier, setIdentifier);
											}}
											type="email"
											required
											label="Email address"
											placeholder="emma@contoso.com"
											error={(() => {
												const $error = error();
												if ($error && $error.target === 'identifier') {
													return $error.msg;
												}
											})()}
										/>

										<TextInput
											ref={(node) => {
												autofocusOnMutation(node, loginMutation, false);
												modelText(node, password, setPassword);
											}}
											type="password"
											autocomplete="current-password"
											required
											label="Password"
											error={(() => {
												const $error = error();
												if ($error && $error.target === 'password') {
													return $error.msg;
												}
											})()}
										/>

										<div class="flex flex-col gap-2">
											<InlineLink
												onClick={() => {
													batch(() => {
														setView({ type: 'handle_initial' });

														setError();
														setIdentifier('');
														setPassword('');
													});
												}}
											>
												Sign in with Bluesky handle instead
											</InlineLink>
										</div>
									</div>
								</Match>

								<Match
									when={(() => {
										const $view = view();
										if ($view.type === 'otp') {
											return $view;
										}
									})()}
									keyed
								>
									{({ from }) => (
										<>
											<div class="flex flex-col gap-1">
												<h2 class="text-2xl font-bold">Enter verification code</h2>
												<h3 class="max-w-84 text-base text-contrast-muted">
													Check your inbox for an email containing the code and enter it here
												</h3>
											</div>

											<div class="flex flex-col gap-4">
												<TextInput
													ref={(node) => {
														autofocusOnMutation(node, loginMutation);
														modelText(node, otp, setOtp);
													}}
													autocomplete="one-time-code"
													required
													label="Verification code"
													placeholder="AAAAA-BBBBB"
													error={(() => {
														const $error = error();
														if ($error && $error.target === 'otp') {
															return $error.msg;
														}
													})()}
												/>

												<InlineLink
													onClick={() => {
														batch(() => {
															setView({ type: `${from}_initial` });

															setError();
															setOtp('');
														});
													}}
												>
													Sign in with another account
												</InlineLink>
											</div>
										</>
									)}
								</Match>
							</Switch>
						</Dialog.Body>

						<Dialog.Actions>
							<Button type="submit" variant="primary" size="lg">
								{(() => {
									const $view = view();
									if ($view.type === 'handle_initial' || $view.type === 'otp') {
										return `Continue`;
									}

									return `Sign in`;
								})()}
							</Button>
						</Dialog.Actions>
					</Fieldset>
				</form>
			</Dialog.Container>
		</>
	);
};

export default SignInDialog;

const formatEmailOtpCode = (code: string): string | undefined => {
	if (code.length === 0) {
		return undefined;
	}

	return (code.includes('-') ? code : code.slice(0, 5) + '-' + code.slice(5)).toUpperCase();
};
