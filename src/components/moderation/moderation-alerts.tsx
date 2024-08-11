import { createMemo, type JSX } from 'solid-js';

import {
	CauseLabel,
	getLocalizedLabel,
	type LabelModerationCause,
	type ModerationCause,
	type ModerationUI,
} from '~/api/moderation';
import { EQUALS_DEQUAL } from '~/api/utils/dequal';
import { on } from '~/lib/misc';
import Avatar from '../avatar';

export interface ModerationAlertsProps {
	ui: ModerationUI;
	class?: string;
}

const ModerationAlerts = (props: ModerationAlertsProps) => {
	const causes = createMemo(() => {
		const ui = props.ui;
		return ui.a.concat(ui.i).filter(isLabelCause);
	}, EQUALS_DEQUAL);

	return on(causes, ($causes) => {
		if ($causes.length === 0) {
			return;
		}

		const nodes = $causes.map((cause) => {
			const locale = getLocalizedLabel(cause.d);

			const avatar = cause.s?.profile.avatar;

			return (
				<button class="group flex h-5 items-center rounded-md bg-[#1A1A1A] text-contrast/75 hover:text-contrast">
					<Avatar
						type="labeler"
						src={avatar}
						size={null}
						class="ml-1 h-3 w-3 opacity-80 group-hover:opacity-100"
					/>
					<span class="mx-1.5 text-xs">{/* @once */ locale.n}</span>
				</button>
			);
		});

		return <div class={`flex flex-wrap gap-1` + (props.class ? ` ${props.class}` : ``)}>{nodes}</div>;
	}) as unknown as JSX.Element;
};

export default ModerationAlerts;

const isLabelCause = (c: ModerationCause): c is LabelModerationCause => {
	return c.t === CauseLabel;
};
