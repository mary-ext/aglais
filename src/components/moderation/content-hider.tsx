import { createSignal, type Component, type JSX, type ParentProps } from 'solid-js';

import {
	CauseLabel,
	CauseMutedKeyword,
	CauseMutedPermanent,
	CauseMutedTemporary,
	SeverityAlert,
	getLocalizedLabel,
	type ModerationCause,
	type ModerationCauseType,
	type ModerationLabeler,
	type ModerationUI,
} from '~/api/moderation';

import FilterOutlinedIcon from '../icons-central/filter-outline';
import InfoOutlinedIcon from '../icons-central/info-outline';
import PersonRemoveOutlinedIcon from '../icons-central/person-remove-outline';
import ProblemOutlinedIcon from '../icons-central/problem-outline';

export interface ContentHiderProps extends ParentProps {
	ui: ModerationUI | undefined;
	ignoreMute?: boolean;
	containerClass?: string;
	innerClass?: string;
	outerClass?: string;
}

const ContentHider = (props: ContentHiderProps) => {
	return (() => {
		const ui = props.ui;
		const blur = ui?.b[0];

		if (!blur || (props.ignoreMute && isOnlyMuted(ui.b))) {
			return <div class={`flex flex-col ` + (props.outerClass || '')}>{props.children}</div>;
		}

		const [override, setOverride] = createSignal(false);

		const type = blur.t;

		let Icon: Component;
		let title: string;
		let forced: boolean | undefined;

		if (type === CauseLabel) {
			const def = blur.d;
			const severity = def.s;

			Icon = severity === SeverityAlert ? ProblemOutlinedIcon : InfoOutlinedIcon;
			title = getLocalizedLabel(def).n;
			forced = !ui.o;
		} else if (type === CauseMutedKeyword) {
			Icon = FilterOutlinedIcon;
			title = blur.n;
		} else if (type === CauseMutedTemporary) {
			Icon = PersonRemoveOutlinedIcon;
			title = `Silenced user`;
		} else {
			Icon = PersonRemoveOutlinedIcon;
			title = `Muted user`;
		}

		return (
			<div class={`flex flex-col ` + (props.containerClass || '')}>
				<button
					disabled={forced}
					onClick={() => setOverride((next) => !next)}
					class="flex h-11 w-full items-center gap-3 self-stretch rounded-md bg-c-contrast-25 px-3 text-c-contrast-900 hover:bg-c-contrast-25"
				>
					<div class="shrink-0 text-lg text-c-contrast-600">
						<Icon />
					</div>
					<span class="grow overflow-hidden text-ellipsis whitespace-nowrap text-left text-sm font-medium">
						{title}
					</span>

					<span hidden={forced} class="text-de font-medium text-c-contrast-600">
						{!override() ? `Show` : `Hide`}
					</span>
				</button>

				{(() => {
					if (type === CauseLabel && !override()) {
						return null;
					}
				})()}

				{(() => {
					if (override()) {
						return <div class={props.innerClass}>{props.children}</div>;
					}
				})()}
			</div>
		);
	}) as unknown as JSX.Element;
};

export default ContentHider;

const renderLabelSource = (source: ModerationLabeler) => {
	const profile = source.profile;

	if (profile) {
		return profile.displayName || `@${profile.handle}`;
	}

	return source.did;
};

const isOnlyMuted = (causes: ModerationCause[]) => {
	let t: ModerationCauseType;
	return causes.every((c) => (t = c.t) === CauseMutedTemporary || t === CauseMutedPermanent);
};
