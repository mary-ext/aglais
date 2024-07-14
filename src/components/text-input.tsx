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
	description?: string;
	value?: string;
	onInput?: (ev: InputEvent) => void;
}

const TextInput = (props: TextInputProps) => {
	const fieldset = useFieldset();
	const id = createId();

	const hasValue = 'value' in props;
	const isDisabled = () => fieldset.disabled || !!props.disabled;

	return (
		<div class={`flex flex-col gap-2` + (isDisabled() ? ` opacity-50` : ``)}>
			<label for={id} class="text-sm font-medium text-contrast empty:hidden">
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
				class="rounded border border-outline-md bg-background px-3 py-2 text-sm leading-6 text-contrast outline-2 -outline-offset-2 outline-accent placeholder:text-contrast-muted focus:outline"
			/>

			{props.error && <p class="text-de text-error">{props.error}</p>}

			<p class="text-pretty text-de text-contrast-muted empty:hidden">{props.description}</p>
		</div>
	);
};

export default TextInput;
