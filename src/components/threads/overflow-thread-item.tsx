import type { OverflowAncestorItem, OverflowDescendantItem } from '~/api/models/post-thread';
import { parseAtUri } from '~/api/utils/strings';

import MoreHorizOutlinedIcon from '../icons-central/more-horiz-outline';

import ThreadLines from './thread-lines';

export interface OverflowThreadItemProps {
	item: OverflowAncestorItem | OverflowDescendantItem;
	/** Expected to be static */
	treeView: boolean;
	/** Expected to be static */
	descendant: boolean;
}

const OverflowThreadItem = (props: OverflowThreadItemProps) => {
	const treeView = props.treeView;
	const descendant = props.descendant;

	return (
		<a
			href={(() => {
				const uri = parseAtUri(props.item.uri);
				return `/${uri.repo}/${uri.rkey}`;
			})()}
			class={
				`flex select-none border-outline hover:bg-contrast/sm active:bg-contrast/sm-pressed` +
				// prettier-ignore
				(!treeView ? ` px-4` + (descendant ? ` border-b` : ``) : ` px-3`)
			}
		>
			{treeView ? (
				<ThreadLines lines={props.item.lines} />
			) : (
				<div class="mr-3 flex w-9 shrink-0 flex-col items-center justify-center gap-1.5">
					<div class="h-0.5 border-l-2 border-outline-md"></div>
					<div class="h-0.5 border-l-2 border-outline-md"></div>
					<div class="h-0.5 border-l-2 border-outline-md"></div>
				</div>
			)}

			<div class="flex items-center gap-3 py-3">
				{treeView && (
					<div class="grid h-5 w-5 place-items-center rounded-full bg-outline-md">
						<MoreHorizOutlinedIcon class="text-xs text-contrast-hinted" />
					</div>
				)}

				<span class="text-sm text-accent">{!descendant ? `See parent replies` : `Continue thread`}</span>
			</div>
		</a>
	);
};

export default OverflowThreadItem;
