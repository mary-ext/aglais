import type { JSX } from 'solid-js';
import TextareaAutosize from 'solid-textarea-autosize';

import { createId } from '~/lib/hooks/id';

import { useFieldset } from './fieldset';

export interface TextareaInputProps {
	ref?: (node: HTMLTextAreaElement) => void;
	label?: string;
	required?: boolean;
	disabled?: boolean;
	placeholder?: string;
	error?: string | null | undefined | false;
	value?: string;
	headerAccessory?: JSX.Element;
	onInput?: (ev: InputEvent) => void;
	maxRows?: number;
	minRows?: number;
}

const TextareaInput = (props: TextareaInputProps) => {
	const fieldset = useFieldset();
	const id = createId();

	const hasValue = 'value' in props;
	const isDisabled = () => fieldset.disabled || !!props.disabled;

	const hasLabel = 'label' in props;
	const hasHeaderAccessory = 'headerAccessory' in props;

	return (
		<div class={`flex flex-col gap-2` + (isDisabled() ? ` opacity-50` : ``)}>
			{(hasLabel || hasHeaderAccessory) && (
				<div class="flex justify-between gap-2">
					<label for={id} class="overflow-hidden break-words text-sm font-medium text-contrast">
						{props.label}
					</label>

					{props.headerAccessory}
				</div>
			)}

			<TextareaAutosize
				ref={props.ref}
				id={id}
				required={props.required}
				disabled={isDisabled()}
				value={hasValue ? props.value : ''}
				onInput={props.onInput}
				placeholder={props.placeholder}
				maxRows={props.maxRows}
				minRows={props.minRows}
				class="resize-none rounded border border-outline-md bg-background px-3 py-2 text-sm leading-6 text-contrast outline-2 -outline-offset-2 outline-accent placeholder:text-contrast-muted focus:outline"
			/>

			{props.error && <p class="text-de text-error">{props.error}</p>}
		</div>
	);
};

export default TextareaInput;
