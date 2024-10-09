import { Match, Show, Switch, batch } from 'solid-js';

import { XRPCError } from '@atcute/client';
import type { AppBskyFeedDefs } from '@atcute/client/lexicons';
import { createMutation } from '@mary/solid-query';

import { updatePostShadow, usePostShadow } from '~/api/cache/post-shadow';
import { formatQueryError } from '~/api/utils/error';
import { getRecord, putRecord } from '~/api/utils/records';

import { globalEvents } from '~/globals/events';
import { useModalContext } from '~/globals/modals';

import { useAgent } from '~/lib/states/agent';
import { useSession } from '~/lib/states/session';

import CircularProgressView from '~/components/circular-progress-view';
import * as Prompt from '~/components/prompt';

export interface PinPostPromptProps {
	post: AppBskyFeedDefs.PostView;
}

const PinPostPrompt = ({ post }: PinPostPromptProps) => {
	const { currentAccount } = useSession();
	const { rpc } = useAgent();

	const { close } = useModalContext();

	const shadow = usePostShadow(post);

	const repo = currentAccount!.did;

	const mutation = createMutation((queryClient) => ({
		async mutationFn({ next }: { next: boolean }) {
			let prevPinnedUri: string | undefined;
			let retriesRemaining = 3;

			try {
				updatePostShadow(queryClient, post.uri, { pinned: next });

				while (true) {
					const existing = await getRecord(rpc, {
						repo,
						collection: 'app.bsky.actor.profile',
						rkey: 'self',
					}).catch(() => undefined);

					let record = existing?.value ?? { $type: 'app.bsky.actor.profile' };

					// Keep note of the previous pin
					prevPinnedUri = record.pinnedPost?.uri;

					// Bail out if the record isn't what we're expecting
					if ((next && prevPinnedUri === post.uri) || (!next && prevPinnedUri !== post.uri)) {
						break;
					}

					if (prevPinnedUri) {
						updatePostShadow(queryClient, prevPinnedUri, { pinned: false });
					}

					record.pinnedPost = next ? { uri: post.uri, cid: post.cid } : undefined;

					try {
						await putRecord(rpc, {
							repo,
							collection: 'app.bsky.actor.profile',
							rkey: 'self',
							record: record,
							swapRecord: existing?.cid ?? null,
						});
					} catch (err) {
						if (err instanceof XRPCError && err.kind === 'InvalidSwapError') {
							if (retriesRemaining--) {
								continue;
							}
						}

						throw err;
					}
					break;
				}
			} catch (err) {
				batch(() => {
					if (post.uri === prevPinnedUri) {
						updatePostShadow(queryClient, post.uri, { pinned: !next });
					} else {
						updatePostShadow(queryClient, post.uri, { pinned: false });

						if (prevPinnedUri) {
							updatePostShadow(queryClient, prevPinnedUri, { pinned: true });
						}
					}
				});

				throw err;
			}
		},
		onSuccess() {
			close();

			setTimeout(() => {
				// @todo: we should probably use something else...
				globalEvents.emit('postpublished');
			}, 1_500);
		},
	}));

	return (
		<Prompt.Container disabled={mutation.isPending}>
			<Switch>
				<Match when={mutation.isPending}>
					<CircularProgressView />
				</Match>

				<Match when>
					<Prompt.Title>{!shadow().pinned ? `Pin this post?` : `Unpin this post?`}</Prompt.Title>

					<Show when={mutation.error}>
						{(error) => <p class="text-pretty text-de text-error">{formatQueryError(error())}</p>}
					</Show>

					<Prompt.Actions>
						<Prompt.Action
							noClose
							variant={!shadow().pinned ? 'primary' : 'danger'}
							onClick={() => mutation.mutate({ next: !shadow().pinned })}
						>
							{!shadow().pinned ? `Pin it` : `Unpin it`}
						</Prompt.Action>
						<Prompt.Action>Cancel</Prompt.Action>
					</Prompt.Actions>
				</Match>
			</Switch>
		</Prompt.Container>
	);
};

export default PinPostPrompt;
