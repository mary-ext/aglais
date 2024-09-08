import type { ParentProps } from 'solid-js';

import { useFieldset } from './fieldset';

export interface InlineLinkProps extends ParentProps {
	href?: string;
	disabled?: boolean;
	onClick?: () => void;
}

const InlineLink = (props: InlineLinkProps) => {
	const fieldset = useFieldset();
	const isDisabled = (): boolean => fieldset.disabled || !!props.disabled;

	return (
		<button
			type="button"
			disabled={isDisabled()}
			onClick={props.onClick}
			class={inlineLinkClassNames(isDisabled)}
		>
			{props.children}
		</button>
	);
};

const inlineLinkClassNames = (isDisabled: () => boolean): string => {
	var cn = `text-accent text-left text-de hover:underline`;

	if (isDisabled()) {
		cn += ` opacity-50`;
	}

	return cn;
};

export default InlineLink;
