import { ClientResponseError, ok } from '@atcute/client';
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
	const { client } = useAgent();

	const queryClient = useQueryClient();

	const onDelete = async () => {
		const uri = parseCanonicalResourceUri(post.uri);

		const write = await client.post('com.atproto.repo.applyWrites', {
			input: {
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

		if (write.ok) {
			updatePostShadow(queryClient, post.uri, { deleted: true });
			onPostDelete?.();
			return;
		}

		if (write.data.error !== 'InternalServerError') {
			throw new ClientResponseError(write);
		}

		await ok(
			client.post('com.atproto.repo.putRecord', {
				input: {
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
			}),
		);

		await ok(
			client.post('com.atproto.repo.deleteRecord', {
				input: {
					repo: currentAccount!.did,
					collection: 'app.bsky.feed.post',
					rkey: uri.rkey,
				},
			}),
		);

		updatePostShadow(queryClient, post.uri, { deleted: true });
		onPostDelete?.();
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
