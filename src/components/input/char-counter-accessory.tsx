import { createMemo } from 'solid-js';

import { formatLong } from '~/lib/intl/number';

export interface CharCounterAccessoryProps {
	value: number;
	max: number;
}

const CharCounterAccessory = (props: CharCounterAccessoryProps) => {
	const isOver = createMemo(() => props.value > props.max);

	return (
		<span class={`text-de tabular-nums` + (!isOver() ? ` text-contrast-muted` : ` text-error`)}>
			{formatLong(props.value)}/{formatLong(props.max)}
		</span>
	);
};

export default CharCounterAccessory;
