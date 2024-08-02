import type { AppBskyActorDefs } from '@mary/bluesky-client/lexicons';

import EyeOpenOutlinedIcon from '../icons-central/eye-open-outline';
import MegaphoneOutlinedIcon from '../icons-central/megaphone-outline';
import ReplyOutlinedIcon from '../icons-central/reply-outline';
import * as Prompt from '../prompt';

export interface BlockAccountPromptProps {
	/** Expected to be static */
	profile:
		| AppBskyActorDefs.ProfileViewBasic
		| AppBskyActorDefs.ProfileView
		| AppBskyActorDefs.ProfileViewDetailed;
}

const BlockAccountPrompt = ({ profile }: BlockAccountPromptProps) => {
	return (
		<Prompt.Container>
			<Prompt.Title>{/* @once */ `Block @${profile.handle}?`}</Prompt.Title>

			<Prompt.Description>Here's what happens if you do:</Prompt.Description>

			<div class="mt-3 flex flex-col gap-3 text-sm">
				<div class="flex items-start gap-3">
					<div class="grid h-8 w-8 shrink-0 place-items-center">
						<MegaphoneOutlinedIcon class="text-xl text-contrast-muted" />
					</div>

					<p class="mt-1.5">They can see they're blocked</p>
				</div>

				<div class="flex items-start gap-3">
					<div class="grid h-8 w-8 shrink-0 place-items-center">
						<EyeOpenOutlinedIcon class="text-xl text-contrast-muted" />
					</div>

					<p class="mt-1.5">They can't see your posts, and you won't see theirs and any replies to them</p>
				</div>

				<div class="flex items-start gap-3">
					<div class="grid h-8 w-8 shrink-0 place-items-center">
						<ReplyOutlinedIcon class="text-xl text-contrast-muted" />
					</div>

					<p class="mt-1.5">They can't mention you or reply to your posts</p>
				</div>
			</div>

			<Prompt.Actions>
				<Prompt.Action variant="danger">Block</Prompt.Action>
				<Prompt.Action>Cancel</Prompt.Action>
			</Prompt.Actions>
		</Prompt.Container>
	);
};

export default BlockAccountPrompt;
