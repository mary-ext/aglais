import type { AppBskyEmbedRecord } from '@atcute/client/lexicons';

import type { ParsedAtUri } from '~/api/types/at-uri';

import BlockOutlinedIcon from '../icons-central/block-outline';

export interface QuoteBlockedEmbedProps {
	embed: AppBskyEmbedRecord.ViewBlocked;
	uri: ParsedAtUri;
}

const QuoteBlockedEmbed = ({ embed, uri }: QuoteBlockedEmbedProps) => {
	const viewer = embed.author.viewer;

	const blocking = !!viewer?.blocking;
	const blockedBy = !!viewer?.blockedBy;

	return (
		<a
			href={/* @once */ `/${uri.repo}/${uri.rkey}`}
			class="flex h-11 w-full items-center gap-3 self-stretch rounded-md border border-outline px-3 text-contrast hover:bg-contrast/sm active:bg-contrast/sm-pressed"
		>
			<div class="grid w-5 shrink-0 place-items-center text-lg text-contrast-muted">
				<BlockOutlinedIcon />
			</div>

			<span class="grow overflow-hidden text-ellipsis whitespace-nowrap text-left text-sm font-medium">
				{blockedBy
					? `You're blocked by this user`
					: blocking
						? `You've blocked this account`
						: `Interaction blocked`}
			</span>

			<span class="text-de font-medium text-accent">View</span>
		</a>
	);
};

export default QuoteBlockedEmbed;
