import type { Component } from 'solid-js';
import { useFieldset } from './fieldset';

export interface IconButtonProps {
	icon: Component;
	title: string;
	// href?: string;
	disabled?: boolean;
	onClick?: (ev: MouseEvent) => void;

	variant?: 'ghost' | 'outline' | 'accent';
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
	var cn = `grid place-items-center rounded-full`;

	if (variant === 'ghost') {
		cn += ` text-contrast`;

		if (!isDisabled()) {
			cn += ` hover:bg-contrast-hinted/md active:bg-contrast-hinted/md-pressed`;
		} else {
			cn += ` opacity-50`;
		}
	} else if (variant === 'outline') {
		cn += ` border border-outline-lg text-contrast`;

		if (!isDisabled()) {
			cn += ` hover:bg-contrast-hinted/md active:bg-contrast-hinted/md-pressed`;
		} else {
			cn += ` opacity-50`;
		}
	} else if (variant === 'accent') {
		cn += ` text-accent`;

		if (!isDisabled()) {
			cn += ` hover:bg-accent/md active:bg-accent/md-pressed`;
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
