import { XRPCError } from '@atcute/client';
import type { AppBskyFeedDefs, AppBskyFeedPost } from '@atcute/client/lexicons';
import { useQueryClient } from '@mary/solid-query';

import { updatePostShadow } from '~/api/cache/post-shadow';
import { parseCanonicalResourceUri } from '~/api/types/at-uri';

import { useAgent } from '~/lib/states/agent';
import { useSession } from '~/lib/states/session';

import * as Prompt from '~/components/prompt';

export interface DeletePostPromptProps {
	/** Expected to be static */
	post: AppBskyFeedDefs.PostView;
	/** Expected to be static */
	onPostDelete?: () => void;
}

const DeletePostPrompt = ({ post, onPostDelete }: DeletePostPromptProps) => {
	const { currentAccount } = useSession();
	const { rpc } = useAgent();

	const queryClient = useQueryClient();

	const onDelete = () => {
		const uri = parseCanonicalResourceUri(post.uri);

		const promise = rpc.call('com.atproto.repo.applyWrites', {
			data: {
				repo: currentAccount!.did,
				writes: [
					{
						$type: 'com.atproto.repo.applyWrites#delete',
						collection: 'app.bsky.feed.post',
						rkey: uri.rkey,
					},
				],
			},
		});

		promise.then(
			() => {
				updatePostShadow(queryClient, post.uri, { deleted: true });
				onPostDelete?.();
			},
			async (err) => {
				if (err instanceof XRPCError && err.kind === 'InternalServerError') {
					await rpc.call('com.atproto.repo.putRecord', {
						data: {
							repo: currentAccount!.did,
							collection: 'app.bsky.feed.post',
							rkey: uri.rkey,
							validate: false,
							record: {
								$type: 'app.bsky.feed.post',
								text: '',
								createdAt: '1970-01-01T00:00:00.000Z',
							} satisfies AppBskyFeedPost.Record,
						},
					});

					await rpc.call('com.atproto.repo.deleteRecord', {
						data: {
							repo: currentAccount!.did,
							collection: 'app.bsky.feed.post',
							rkey: uri.rkey,
						},
					});

					updatePostShadow(queryClient, post.uri, { deleted: true });
					onPostDelete?.();
					return;
				}

				throw err;
			},
		);
	};

	return (
		<Prompt.Container>
			<Prompt.Title>Delete this post?</Prompt.Title>
			<Prompt.Description>
				This can't be undone, the post will be removed from your profile, timeline of your followers, and
				search results.
			</Prompt.Description>

			<Prompt.Actions>
				<Prompt.Action variant="danger" onClick={onDelete}>
					Delete
				</Prompt.Action>

				<Prompt.Action>Cancel</Prompt.Action>
			</Prompt.Actions>
		</Prompt.Container>
	);
};

export default DeletePostPrompt;
