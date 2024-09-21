import { Match, Switch } from 'solid-js';

import { XRPCError } from '@atcute/client';
import type { AppBskyActorDefs } from '@atcute/client/lexicons';
import { useQueryClient } from '@mary/solid-query';

import { formatQueryError } from '~/api/utils/error';

import { openModal } from '~/globals/modals';

import { useSession } from '~/lib/states/session';

import Button from '~/components/button';
import SignInDialogLazy from '~/components/main/sign-in-dialog-lazy';

export interface ErrorViewProps {
	error: unknown;
	onRetry?: () => void;
}

const ErrorView = (props: ErrorViewProps) => {
	const queryClient = useQueryClient();

	const { currentAccount } = useSession();

	return (
		<div class="p-4">
			<div class="mb-4 text-sm">
				<p class="font-bold">Something went wrong</p>
				<p class="text-muted-fg">{formatQueryError(props.error)}</p>
			</div>

			<div class="flex flex-wrap gap-4">
				<Switch>
					<Match when={isInvalidTokenError(props.error)}>
						<Button
							onClick={() => {
								type Profile = AppBskyActorDefs.ProfileViewDetailed;

								const did = currentAccount!.did;
								const profile = queryClient.getQueryData<Profile>(['profile', currentAccount!.did]);

								const identifier = profile && profile.handle !== 'handle.invalid' ? profile.handle : did;

								openModal(() => <SignInDialogLazy autologin={identifier} />);
							}}
							variant="primary"
						>
							Sign in again
						</Button>

						<Button onClick={props.onRetry}>Try again</Button>
					</Match>

					<Match when>
						<Button onClick={props.onRetry} variant="primary">
							Try again
						</Button>
					</Match>
				</Switch>
			</div>
		</div>
	);
};

export default ErrorView;

const isInvalidTokenError = (err: unknown): boolean => {
	return err instanceof XRPCError && err.kind === 'invalid_token';
};
