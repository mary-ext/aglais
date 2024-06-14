import { createId } from '~/lib/hooks/id';

import { useFieldset } from './fieldset';

export interface TextInputProps {
	ref?: (node: HTMLInputElement) => void;
	label?: string;
	type?: 'text' | 'email' | 'password' | 'search' | 'tel' | 'url';
	autocomplete?:
		| 'off'
		| 'on'
		| 'name'
		| 'email'
		| 'username'
		| 'current-password'
		| 'new-password'
		| 'one-time-code';
	pattern?: string;
	required?: boolean;
	disabled?: boolean;
	placeholder?: string;
	error?: string | null | undefined | false;
	value?: string;
	onInput?: (ev: InputEvent) => void;
}

const TextInput = (props: TextInputProps) => {
	const fieldset = useFieldset();
	const id = createId();

	const hasValue = 'value' in props;
	const isDisabled = () => fieldset.disabled || !!props.disabled;

	return (
		<div class="flex flex-col gap-2">
			<label
				for={id}
				class={
					`text-sm font-medium empty:hidden` +
					(!isDisabled() ? ` text-c-contrast-900` : ` text-c-contrast-700`)
				}
			>
				{props.label}
			</label>
			<input
				ref={props.ref}
				id={id}
				type={props.type || 'text'}
				autocomplete={props.autocomplete}
				pattern={props.pattern}
				required={props.required}
				disabled={isDisabled()}
				value={hasValue ? props.value : ''}
				onInput={props.onInput}
				placeholder={props.placeholder}
				class={buttonClassNames(isDisabled)}
			/>

			{props.error && <p class="text-de text-c-negative-300">{props.error}</p>}
		</div>
	);
};

const buttonClassNames = (isDisabled: () => boolean): string => {
	let cn = `rounded bg-c-black px-3 py-2 text-sm leading-6  outline-2 -outline-offset-2 outline-c-primary-400 focus:outline`;

	if (!isDisabled()) {
		cn += ` border border-c-contrast-300 text-c-contrast-900 placeholder:text-c-contrast-400`;
	} else {
		cn += ` border border-c-contrast-100 text-c-contrast-600 placeholder:text-c-contrast-400`;
	}

	return cn;
};

export default TextInput;
