import type { AppBskyFeedDefs } from '@atcute/client/lexicons';
import { useQueryClient } from '@mary/solid-query';

import { updatePostShadow } from '~/api/cache/post-shadow';
import { deleteRecord } from '~/api/utils/records';
import { parseAtUri } from '~/api/utils/strings';

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
		const uri = parseAtUri(post.uri);
		const promise = deleteRecord(rpc, {
			repo: currentAccount!.did,
			collection: 'app.bsky.feed.post',
			rkey: uri.rkey,
		});

		updatePostShadow(queryClient, post.uri, { deleted: true });

		if (onPostDelete) {
			promise.then(onPostDelete);
		}
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
