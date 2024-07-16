import { createMemo, type Component, type ComponentProps, type JSX } from 'solid-js';

import ChevronRightOutlinedIcon from './icons-central/chevron-right-outline';

export interface BoxedContainerProps {
	children: JSX.Element;
}

const BoxedContainer = (props: BoxedContainerProps) => {
	return <div class="flex flex-col gap-6 py-4">{props.children}</div>;
};

export { BoxedContainer as Container };

export interface BoxedGroupProps {
	children: JSX.Element;
}

const BoxedGroup = (props: BoxedGroupProps) => {
	return <div class="flex flex-col gap-2">{props.children}</div>;
};

export { BoxedGroup as Group };

export interface BoxedGroupHeaderProps {
	children: JSX.Element;
}

const BoxedGroupHeader = (props: BoxedGroupHeaderProps) => {
	return <p class="px-4 text-sm font-medium text-contrast-muted">{props.children}</p>;
};

export { BoxedGroupHeader as GroupHeader };

export interface BoxedGroupBlurbProps {
	children: JSX.Element;
}

const BoxedGroupBlurb = (props: BoxedGroupBlurbProps) => {
	return <p class="text-pretty px-4 text-de text-contrast-muted">{props.children}</p>;
};

export { BoxedGroupBlurb as GroupBlurb };

export interface BoxedListProps {
	children: JSX.Element;
}

const BoxedList = (props: BoxedListProps) => {
	return (
		<div class="flex flex-col divide-y divide-outline/50 overflow-hidden rounded-lg bg-contrast/5">
			{props.children}
		</div>
	);
};

export { BoxedList as List };

export interface BoxedStaticItemProps {
	label: string;
	description: string;
}

const BoxedStaticItem = (props: BoxedStaticItemProps) => {
	return (
		<div class="flex flex-col px-4 py-3 text-left">
			<p class="whitespace-nowrap text-sm font-medium">{props.label}</p>
			<p class="text-pretty break-words text-de text-contrast-muted">{props.description}</p>
		</div>
	);
};

export { BoxedStaticItem as StaticItem };

export interface BoxedLinkItemProps {
	label: string;
	icon?: Component<ComponentProps<'svg'>>;
	description?: string;
	blurb?: string;
	to: string;
}

const BoxedLinkItem = (props: BoxedLinkItemProps) => {
	return (
		<a
			href={props.to}
			class="flex justify-between gap-4 px-4 py-3 text-left hover:bg-contrast/sm active:bg-contrast/sm-pressed"
		>
			{(() => {
				const Icon = props.icon;

				if (Icon) {
					return <Icon class="mt-px text-lg text-contrast-muted" />;
				}
			})()}

			<div class="flex min-w-0 grow flex-col">
				<p class="whitespace-nowrap text-sm font-medium">{props.label}</p>
				<p class="text-pretty break-words text-de text-contrast-muted empty:hidden">{props.description}</p>
			</div>

			<span class="flex min-w-0 gap-1">
				<span class="min-w-0 break-words text-de text-contrast-muted empty:hidden">{props.blurb}</span>
				<ChevronRightOutlinedIcon class="-mr-1.5 shrink-0 text-xl text-contrast-muted" />
			</span>
		</a>
	);
};

export { BoxedLinkItem as LinkItem };

export interface BoxedButtonItemProps {
	label: string;
	description?: string;
	blurb?: string;
	variant?: 'default' | 'danger';
	onClick?: () => void;
}

const BoxedButtonItem = (props: BoxedButtonItemProps) => {
	return (
		<button
			onClick={props.onClick}
			class="flex justify-between gap-2 px-4 py-3 text-left hover:bg-contrast/sm active:bg-contrast/sm-pressed"
		>
			<div class="flex min-w-0 grow flex-col">
				<p class={buttonItemLabelProps(props)}>{props.label}</p>
				<p class="text-pretty break-words text-de text-contrast-muted empty:hidden">{props.description}</p>
			</div>

			<span class="flex min-w-0 gap-1">
				<span class="min-w-0 break-words text-de text-contrast-muted empty:hidden">{props.blurb}</span>
				<ChevronRightOutlinedIcon class="-mr-1.5 shrink-0 text-xl text-contrast-muted" />
			</span>
		</button>
	);
};

const buttonItemLabelProps = ({ variant = 'default' }: BoxedButtonItemProps) => {
	let cn = `whitespace-nowrap text-sm font-medium`;

	if (variant === 'default') {
		cn += ` text-contrast`;
	} else if (variant === 'danger') {
		cn += ` text-error`;
	}

	return cn;
};

export { BoxedButtonItem as ButtonItem };

export interface BoxedToggleItemProps {
	label: string;
	description?: string;
	enabled: boolean;
	onChange: (next: boolean) => void;
}

const BoxedToggleItem = (props: BoxedToggleItemProps) => {
	const enabled = createMemo(() => !!props.enabled);
	const onChange = props.onChange;

	return (
		<button
			onClick={() => onChange(!enabled())}
			class="flex justify-between gap-2 px-4 py-3 text-left hover:bg-contrast/sm active:bg-contrast/sm-pressed"
		>
			<div class="flex min-w-0 grow flex-col">
				<p class="whitespace-nowrap text-sm font-medium">{props.label}</p>
				<p class="text-pretty break-words text-de text-contrast-muted empty:hidden">{props.description}</p>
			</div>

			<div class="shrink-0">
				{(() => {
					if (enabled()) {
						return (
							<div class="flex h-5 w-8 items-center justify-end overflow-hidden rounded-full border border-transparent bg-accent">
								<div class="m-1 h-2.5 w-2.5 rounded-full bg-accent-fg"></div>
							</div>
						);
					} else {
						return (
							<div class="flex h-5 w-8 items-center overflow-hidden rounded-full border border-outline-md bg-background">
								<div class="m-1 h-2.5 w-2.5 rounded-full bg-outline-md"></div>
							</div>
						);
					}
				})()}
			</div>
		</button>
	);
};

export { BoxedToggleItem as ToggleItem };

export interface SelectItemOption<T> {
	value: T;
	label: string;
	shortLabel?: string;
}

export interface BoxedSelectItemProps<T> {
	label: string;
	description?: string;
	value: T;
	options: SelectItemOption<T>[];
	onChange: (next: T) => void;
}

const BoxedSelectItem = <T,>(props: BoxedSelectItemProps<T>) => {
	const options = createMemo(() => props.options);
	const selected = createMemo(() => {
		const $options = options();
		const $value = props.value;

		return $options.find((item) => item.value === $value);
	});

	return (
		<button class="flex flex-col px-4 py-3 text-left hover:bg-contrast/sm active:bg-contrast/sm-pressed">
			<div class="flex justify-between">
				<p class="min-w-0 whitespace-nowrap text-sm font-medium">{props.label}</p>

				<span class="flex min-w-0 gap-1">
					<span class="min-w-0 break-words text-de text-contrast-muted">
						{(() => {
							const $selected = selected();
							if ($selected) {
								return $selected.shortLabel ?? $selected.label;
							}
						})()}
					</span>
					<ChevronRightOutlinedIcon class="-mr-1 mt-px shrink-0 rotate-90 text-lg text-contrast-muted" />
				</span>
			</div>

			<p class="text-pretty break-words text-de text-contrast-muted empty:hidden">{props.description}</p>
		</button>
	);
};

export { BoxedSelectItem as SelectItem };
