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

import CircleInfoOutlinedIcon from '../icons-central/circle-info-outline';
import FilterOutlinedIcon from '../icons-central/filter-outline';
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

			Icon = severity === SeverityAlert ? ProblemOutlinedIcon : CircleInfoOutlinedIcon;
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
					class="flex h-11 w-full items-center gap-3 self-stretch rounded-md border border-outline px-3 text-contrast hover:bg-contrast/sm active:bg-contrast/sm-pressed"
				>
					<div class="shrink-0 text-lg text-contrast-muted">
						<Icon />
					</div>
					<span class="grow overflow-hidden text-ellipsis whitespace-nowrap text-left text-sm font-medium">
						{title}
					</span>

					<span hidden={forced} class="text-de font-medium text-accent">
						{!override() ? `Show` : `Hide`}
					</span>
				</button>

				{(() => {
					if (type === CauseLabel && !override()) {
						const source = blur.s;
						return (
							<div class="mt-1.5 break-words text-de text-contrast-muted">
								Applied by <span>{source ? renderLabelSource(source) : `the author`}</span>.{' '}
								<button onClick={() => {}} class="text-accent hover:underline">
									Learn more
								</button>
							</div>
						);
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
