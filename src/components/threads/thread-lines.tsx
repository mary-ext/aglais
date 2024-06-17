import { LineType } from '~/api/models/post-thread';

import { mapDefined } from '~/lib/misc';

export interface ThreadLinesProps {
	/** Expected to be static */
	lines: LineType[] | undefined;
}

const ThreadLines = ({ lines }: ThreadLinesProps) => {
	if (lines?.length) {
		return mapDefined(lines, (line) => {
			const drawVertical = line === LineType.VERTICAL || line === LineType.VERTICAL_RIGHT;
			const drawRight = line === LineType.UP_RIGHT || line === LineType.VERTICAL_RIGHT;

			return (
				<div class="relative w-5 shrink-0">
					{drawRight && (
						<div class="absolute right-[2px] top-0 h-[16px] w-[9px] rounded-bl-[9px] border-b-2 border-l-2 border-c-contrast-100"></div>
					)}
					{drawVertical && (
						<div class="absolute bottom-0 left-[9px] top-0 border-l-2 border-c-contrast-100"></div>
					)}
				</div>
			);
		});
	}
};

export default ThreadLines;
