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
	large?: boolean;
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

		const large = props.large;

		const nodes = $causes.map((cause) => {
			const locale = getLocalizedLabel(cause.d);

			const avatar = cause.s?.profile.avatar;

			return (
				<button
					class={
						`group flex items-center rounded-md bg-[#1A1A1A] text-contrast/75 hover:text-contrast` +
						(!large ? ` h-5 text-xs` : ` h-6 text-de`)
					}
				>
					<Avatar
						type="labeler"
						src={avatar}
						size={null}
						class={`ml-1 opacity-80 group-hover:opacity-100` + (!large ? ` h-3 w-3` : ` h-4 w-4`)}
					/>
					<span class="mx-1.5">{/* @once */ locale.n}</span>
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
