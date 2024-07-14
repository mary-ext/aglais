import type { Component, JSX } from 'solid-js';
import { useFieldset } from './fieldset';

export interface IconButtonProps {
	icon: Component;
	title: string;
	// href?: string;
	disabled?: boolean;
	onClick?: JSX.EventHandler<HTMLButtonElement, MouseEvent>;

	variant?: 'ghost' | 'outline' | 'accent' | 'danger' | 'black';
	size?: 'md' | 'sm';
	class?: string;
}

const IconButton = (props: IconButtonProps) => {
	const fieldset = useFieldset();
	const isDisabled = (): boolean => fieldset.disabled || !!props.disabled;

	return (
		<button
			type="button"
			disabled={isDisabled()}
			title={props.title}
			onClick={props.onClick}
			class={iconButtonClasses(isDisabled, props)}
		>
			{(() => {
				const Icon = props.icon;
				return <Icon />;
			})()}
		</button>
	);
};

const iconButtonClasses = (
	isDisabled: () => boolean,
	{ variant = 'ghost', size = 'md', class: className }: IconButtonProps,
) => {
	var cn = `grid shrink-0 place-items-center`;

	if (variant === 'ghost') {
		cn += ` rounded-full text-contrast`;

		if (!isDisabled()) {
			cn += ` hover:bg-contrast-hinted/md active:bg-contrast-hinted/md-pressed`;
		} else {
			cn += ` opacity-50`;
		}
	} else if (variant === 'outline') {
		cn += ` rounded border border-outline-lg text-contrast`;

		if (!isDisabled()) {
			cn += ` hover:bg-contrast-hinted/md active:bg-contrast-hinted/md-pressed`;
		} else {
			cn += ` opacity-50`;
		}
	} else if (variant === 'accent') {
		cn += ` rounded-full text-accent`;

		if (!isDisabled()) {
			cn += ` hover:bg-accent/md active:bg-accent/md-pressed`;
		} else {
			cn += ` opacity-50`;
		}
	} else if (variant === 'black') {
		cn += ` rounded-full bg-p-neutral-950/75 text-white`;

		if (!isDisabled()) {
			cn += ` hover:bg-p-neutral-800/75 active:bg-p-neutral-700/75`;
		} else {
			cn += ` opacity-50`;
		}
	} else if (variant === 'danger') {
		cn += ` rounded-full text-p-red-600`;

		if (!isDisabled()) {
			cn += ` hover:bg-p-red-800/md active:bg-p-red-700/md-pressed`;
		} else {
			cn += ` opacity-50`;
		}
	}

	if (size === 'md') {
		cn += ` h-9 w-9 text-lg`;
	} else if (size === 'sm') {
		cn += ` h-8 w-8 text-lg`;
	}

	if (className) {
		return `${cn} ${className}`;
	} else {
		return cn;
	}
};

export default IconButton;
