import { createMemo } from 'solid-js';

import type { AppBskyGraphDefs } from '@atcute/client/lexicons';
import { useQueryClient } from '@mary/solid-query';

import { moderateGeneric } from '~/api/moderation/entities/generic';
import { precacheList } from '~/api/queries-cache/list-precache';

import { history } from '~/globals/navigation';

import { isElementAltClicked, isElementClicked } from '~/lib/interaction';
import { useModerationOptions } from '~/lib/states/moderation';

import Avatar from '~/components/avatar';

import { getListPurposeLabel, getListUrl } from './util';

export interface ListItemProps {
	/** Expected to be static */
	item: AppBskyGraphDefs.ListView;
}

const ListItem = ({ item }: ListItemProps) => {
	const queryClient = useQueryClient();
	const moderationOptions = useModerationOptions();

	const creator = item.creator;
	const href = getListUrl(item);

	const moderation = createMemo(() => moderateGeneric(item, creator.did, moderationOptions()));

	const handleClick = (ev: MouseEvent | KeyboardEvent) => {
		if (!isElementClicked(ev)) {
			return;
		}

		ev.preventDefault();
		precacheList(queryClient, item);

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
			class="flex cursor-pointer select-none flex-col border-b border-outline px-4 py-3 hover:bg-contrast/sm active:bg-contrast/sm-pressed"
		>
			<div class="flex items-center gap-3">
				<Avatar
					type="list"
					src={item.avatar}
					href={href}
					moderation={moderation()}
					onClick={() => precacheList(queryClient, item)}
					size="lg"
				/>

				<a href={href} onClick={() => precacheList(queryClient, item)} class="min-w-0 grow">
					<p class="break-words text-sm font-bold">{item.name}</p>
					<p class="overflow-hidden text-ellipsis whitespace-nowrap text-de text-contrast-muted">
						{/* @once */ `${getListPurposeLabel(item.purpose)} by @${creator.handle}`}
					</p>
				</a>
			</div>

			<p class="mt-3 line-clamp-5 whitespace-pre-wrap break-words text-de empty:hidden">
				{/* @once */ item.description || <span class="text-contrast-muted">No description set.</span>}
			</p>
		</div>
	);
};

export default ListItem;
