import type { JSX } from 'solid-js';

import { useFieldset } from './fieldset';

export interface ButtonProps {
	title?: string;
	href?: string;
	disabled?: boolean;
	type?: 'button' | 'submit' | 'reset';
	onClick?: (ev: MouseEvent) => void;

	children: JSX.Element;

	size?: 'sm' | 'md';
	variant?: 'outline' | 'primary' | 'danger' | 'ghost';
	class?: string;
}

const Button = (props: ButtonProps) => {
	const fieldset = useFieldset();
	const isDisabled = (): boolean => fieldset.disabled || !!props.disabled;

	if ('href' in props) {
		return (
			<a
				href={!isDisabled() ? props.href : undefined}
				title={props.title}
				onClick={props.onClick}
				class={buttonClassNames(isDisabled, props)}
			>
				{props.children}
			</a>
		);
	}

	return (
		<button
			type={props.type || 'button'}
			disabled={isDisabled()}
			title={props.title}
			onClick={props.onClick}
			class={buttonClassNames(isDisabled, props)}
		>
			{props.children}
		</button>
	);
};

export default Button;

const buttonClassNames = (
	isDisabled: () => boolean,
	{ size = 'sm', variant = 'outline', class: className }: ButtonProps,
): string => {
	var cn = `flex select-none items-center justify-center rounded text-sm font-semibold leading-none`;

	if (isDisabled()) {
		cn += ` pointer-events-none`;
	}

	if (size === 'sm') {
		cn += ` h-8 px-4`;
	} else if (size === 'md') {
		cn += ` h-10 px-4`;
	}

	if (variant === 'primary') {
		cn += ` bg-accent text-accent-fg`;

		if (!isDisabled()) {
			cn += ` hover:bg-accent-hover active:bg-accent-active`;
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
	} else if (variant === 'ghost') {
		cn += ` text-accent`;

		if (!isDisabled()) {
			cn += ` hover:bg-accent/md active:bg-accent/md-pressed`;
		} else {
			cn += ` opacity-50`;
		}
	} else if (variant === 'danger') {
		cn += ` text-white bg-p-red-600`;

		if (!isDisabled()) {
			cn += ` hover:bg-p-red-700 active:bg-p-red-800`;
		} else {
			cn += ` opacity-50`;
		}
	}

	if (className) {
		cn += ` ${className}`;
	}

	return cn;
};
