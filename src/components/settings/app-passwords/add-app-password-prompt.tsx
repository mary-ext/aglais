import { Match, Switch, createSignal } from 'solid-js';

import { createMutation } from '@mary/solid-query';

import { autofocusNode, modelChecked, modelText } from '~/lib/input-refs';
import { useAgent } from '~/lib/states/agent';

import CheckboxInput from '../../checkbox-input';
import CheckOutlinedIcon from '../../icons-central/check-outline';
import * as Prompt from '../../prompt';
import TextInput from '../../text-input';

export interface AddAppPasswordPromptProps {}

const AddAppPasswordPrompt = ({}: AddAppPasswordPromptProps) => {
	const { rpc } = useAgent();

	const [name, setName] = createSignal('');
	const [privileged, setPrivileged] = createSignal(false);
	const [copied, setCopied] = createSignal(false);

	const mutation = createMutation((queryClient) => {
		return {
			async mutationFn() {
				const { data } = await rpc.call('com.atproto.server.createAppPassword', {
					data: {
						name: name().replace(/^\s+|\s+$|(?<=\s)\s+/g, ''),
						privileged: privileged(),
					},
				});

				return data;
			},
			async onSuccess() {
				queryClient.invalidateQueries({ queryKey: ['app-passwords'] });
			},
		};
	});

	return (
		<Prompt.Container disabled={mutation.isPending} maxWidth="md">
			<Switch>
				<Match when={mutation.data} keyed>
					{(result) => (
						<>
							<Prompt.Title>App password created!</Prompt.Title>

							<div class="mt-2 flex flex-col gap-4">
								<p class="text-pretty text-sm">
									<strong>{/* @once */ result.name}</strong> has been created, use this password when signing
									in to the intended client or service.
								</p>

								<input
									ref={(node) => {
										autofocusNode(node);
									}}
									readonly
									value={/* @once */ result.password}
									class="rounded border border-outline-md bg-background px-3 py-2 text-center font-mono text-sm leading-6 tracking-widest text-contrast outline-2 -outline-offset-2 outline-accent placeholder:text-contrast-muted focus:outline"
								/>

								<p class="text-pretty text-de text-contrast-muted">
									For security reasons, you won't be able to view this password again.{' '}
									<strong>If you lose it, revoke the password</strong>.
								</p>
							</div>

							<Prompt.Actions>
								<Prompt.Action
									onClick={() => {
										navigator.clipboard.writeText(result.password).then(() => {
											setCopied(true);
										});
									}}
									noClose
									variant="primary"
								>
									{copied() ? (
										<>
											<CheckOutlinedIcon class="-ml-6 mr-1 text-xl" />
											Copied
										</>
									) : (
										<>Copy</>
									)}
								</Prompt.Action>
								<Prompt.Action>Close</Prompt.Action>
							</Prompt.Actions>
						</>
					)}
				</Match>

				<Match when>
					<Prompt.Title>Create an App Password</Prompt.Title>

					<div class="mt-4 flex flex-col gap-4">
						<TextInput
							ref={(node) => {
								autofocusNode(node);
								modelText(node, name, setName);
							}}
							label="Descriptive name"
							description="Give this password a descriptive name to help you remember what it's used for"
							placeholder="everlasting-dreams"
						/>

						<CheckboxInput
							ref={(node) => {
								modelChecked(node, privileged, setPrivileged);
							}}
							label="Allow privileged access"
							description="Give clients access to your direct messages and authorization to other services on your behalf"
						/>

						<p hidden={!mutation.isError} class="text-pretty text-de text-error">
							Something went wrong when attempting to create this app password, try again later.
						</p>
					</div>

					<Prompt.Actions>
						<Prompt.Action
							disabled={name().length > 32 || name().trim().length === 0}
							onClick={() => mutation.mutate()}
							noClose
							variant="primary"
						>
							Create
						</Prompt.Action>
						<Prompt.Action>Cancel</Prompt.Action>
					</Prompt.Actions>
				</Match>
			</Switch>
		</Prompt.Container>
	);
};

export default AddAppPasswordPrompt;
