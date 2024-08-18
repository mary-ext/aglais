import { createMemo } from 'solid-js';

import type { AppBskyFeedThreadgate } from '@atcute/client/lexicons';

import { useModalContext } from '~/globals/modals';

import AtOutlinedIcon from '../../icons-central/at-outline';
import EarthOutlinedIcon from '../../icons-central/earth-outline';
import PersonCheckOutlinedIcon from '../../icons-central/person-check-outline';
import * as Menu from '../../menu';

import { ThreadgateKnownValue, getThreadgateValue } from '../lib/state';

export interface ThreadgateMenuProps {
	anchor: HTMLElement;
	value: AppBskyFeedThreadgate.Record['allow'];
	onChange: (next: AppBskyFeedThreadgate.Record['allow']) => void;
}

const ThreadgateMenu = (props: ThreadgateMenuProps) => {
	const onChange = props.onChange;

	const { close } = useModalContext();
	const value = createMemo(() => getThreadgateValue(props.value));

	return (
		<Menu.Container anchor={props.anchor} placement="bottom-start">
			<div class="px-4 py-3">
				<p class="text-sm font-bold">Who can reply?</p>
				<p class="text-de text-contrast-muted">Choose who can reply to this post</p>
			</div>

			<Menu.Item
				icon={EarthOutlinedIcon}
				label="Everyone"
				checked={value() === ThreadgateKnownValue.EVERYONE}
				onClick={() => {
					close();
					onChange(undefined);
				}}
			/>
			<Menu.Item
				icon={AtOutlinedIcon}
				label="Mentioned users"
				checked={value() === ThreadgateKnownValue.MENTIONS}
				onClick={() => {
					close();
					onChange([{ $type: 'app.bsky.feed.threadgate#mentionRule' }]);
				}}
			/>
			<Menu.Item
				icon={PersonCheckOutlinedIcon}
				label="Followed users"
				checked={value() === ThreadgateKnownValue.FOLLOWS}
				onClick={() => {
					close();
					onChange([{ $type: 'app.bsky.feed.threadgate#followingRule' }]);
				}}
			/>
		</Menu.Container>
	);
};

export default ThreadgateMenu;
