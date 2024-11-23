import { createMemo } from 'solid-js';

import type { AppBskyGraphDefs } from '@atcute/client/lexicons';

import { moderateGeneric } from '~/api/moderation/entities/generic';
import { parseAtUri } from '~/api/utils/strings';

import { history } from '~/globals/navigation';

import { isElementAltClicked, isElementClicked } from '~/lib/interaction';
import { useModerationOptions } from '~/lib/states/moderation';

import Avatar from '~/components/avatar';

export interface ListItemProps {
	/** Expected to be static */
	item: AppBskyGraphDefs.ListView;
}

const ListItem = ({ item }: ListItemProps) => {
	const moderationOptions = useModerationOptions();

	const creator = item.creator;
	const href = `/${creator.did}/lists/${parseAtUri(item.uri).rkey}`;

	const moderation = createMemo(() => moderateGeneric(item, creator.did, moderationOptions()));

	const handleClick = (ev: MouseEvent | KeyboardEvent) => {
		if (!isElementClicked(ev)) {
			return;
		}

		ev.preventDefault();

		if (isElementAltClicked(ev)) {
			window.open(href, '_blank');
		} else {
			history.navigate(href);
		}
	};

	return (
		<div
			tabindex={0}
			onClick={handleClick}
			onAuxClick={handleClick}
			onKeyDown={handleClick}
			class="flex cursor-pointer select-none flex-col px-4 py-3 hover:bg-contrast/sm active:bg-contrast/sm-pressed"
		>
			<div class="flex items-center gap-3">
				<Avatar type="list" src={item.avatar} href={href} moderation={moderation()} size="lg" />

				<a href={href} class="min-w-0 grow">
					<p class="break-words text-sm font-bold">{item.name}</p>
					<p class="overflow-hidden text-ellipsis whitespace-nowrap text-de text-contrast-muted">
						{/* @once */ `${getPurpose(item.purpose)} by @${creator.handle}`}
					</p>
				</a>
			</div>

			<p class="mt-3 line-clamp-5 whitespace-pre-wrap break-words text-de empty:hidden">
				{/* @once */ item.description}
			</p>
		</div>
	);
};

export default ListItem;

const getPurpose = (purpose: AppBskyGraphDefs.ListPurpose) => {
	switch (purpose) {
		case 'app.bsky.graph.defs#curatelist':
			return `Curation list`;
		case 'app.bsky.graph.defs#modlist':
			return `Moderation list`;
	}

	return `Unknown list`;
};
