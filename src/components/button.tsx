import type { JSX } from 'solid-js';

import { history } from '~/globals/navigation';

import { useFieldset } from './fieldset';

export interface ButtonProps {
	title?: string;
	href?: string;
	disabled?: boolean;
	type?: 'button' | 'submit' | 'reset';
	onClick?: (ev: MouseEvent) => void;

	children: JSX.Element;

	size?: 'sm' | 'md';
	variant?: 'outline' | 'primary' | 'ghost';
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
				onClick={handleLinkClick(() => props.onClick)}
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
		if (!isDisabled()) {
			cn += ` bg-c-primary-500 text-c-white hover:bg-c-primary-600`;
		} else {
			cn += ` bg-c-primary-700 text-c-white/50`;
		}
	} else if (variant === 'outline') {
		if (!isDisabled()) {
			cn += ` border border-c-contrast-300 text-c-contrast-900 hover:bg-c-contrast-25`;
		} else {
			cn += ` border border-c-contrast-100 text-c-contrast-400`;
		}
	} else if (variant === 'ghost') {
		if (!isDisabled()) {
			cn += ` text-c-contrast-900 hover:bg-c-contrast-50`;
		} else {
			cn += ` text-c-contrast-400`;
		}
	}

	if (className) {
		cn += ` ${className}`;
	}

	return cn;
};

export const handleLinkClick = (fn: () => ButtonProps['onClick']) => {
	return (event: MouseEvent): void => {
		fn()?.(event);
		handleLinkNavigation(event);
	};
};

export const handleLinkNavigation = (event: MouseEvent) => {
	if (!event.defaultPrevented) {
		const anchor = event.currentTarget as HTMLAnchorElement;
		const href = anchor.href;
		const target = anchor.target;

		if (href !== '' && (target === '' || target === '_self') && isLinkEvent(event)) {
			const { origin, pathname, search, hash } = new URL(href);

			if (location.origin === origin) {
				event.preventDefault();
				history.navigate({ pathname, search, hash });
			}
		}
	}
};

const isLinkEvent = (event: MouseEvent) => {
	return event.button === 0 && !isModifiedEvent(event);
};

const isModifiedEvent = (event: MouseEvent) => {
	return event.metaKey || event.altKey || event.ctrlKey || event.shiftKey;
};
