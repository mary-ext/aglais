import { createMemo, type JSX } from 'solid-js';

import { LineType } from '~/api/models/post-thread';
import { EQUALS_DEQUAL } from '~/api/utils/dequal';

import { mapDefined, on } from '~/lib/utils/misc';

export interface ThreadLinesProps {
	lines: LineType[] | undefined;
}

const ThreadLines = (props: ThreadLinesProps) => {
	const get = createMemo(() => props.lines, EQUALS_DEQUAL);

	return on(get, (lines) => {
		if (!lines?.length) {
			return undefined;
		}

		return mapDefined(lines, (line) => {
			const drawVertical = line === LineType.VERTICAL || line === LineType.VERTICAL_RIGHT;
			const drawRight = line === LineType.UP_RIGHT || line === LineType.VERTICAL_RIGHT;

			return (
				<div class="relative w-5 shrink-0">
					{drawRight && (
						<div class="absolute right-[2px] top-0 h-[22px] w-[9px] rounded-bl-[9px] border-b-2 border-l-2 border-outline-md"></div>
					)}
					{drawVertical && (
						<div class="absolute bottom-0 left-[9px] top-0 border-l-2 border-outline-md"></div>
					)}
				</div>
			);
		});
	}) as unknown as JSX.Element;
};

export default ThreadLines;
