import type { Component } from 'solid-js';
import { useFieldset } from './fieldset';

export interface IconButtonProps {
	icon: Component;
	title: string;
	// href?: string;
	disabled?: boolean;
	onClick?: (ev: MouseEvent) => void;

	variant?: 'ghost' | 'outline';
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
		if (!isDisabled()) {
			cn += ` text-c-contrast-900 hover:bg-c-contrast-50`;
		} else {
			cn += ` text-c-contrast-400`;
		}
	} else if (variant === 'outline') {
		if (!isDisabled()) {
			cn += ` border border-c-contrast-300 text-c-contrast-900 hover:bg-c-contrast-25`;
		} else {
			cn += ` border border-c-contrast-100 text-c-contrast-400`;
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
