import { createMemo, type JSX } from 'solid-js';

import { createId } from '~/lib/hooks/id';
import { formatLong } from '~/lib/intl/number';
import { useTextareaAutosize } from '~/lib/textarea-autosize';

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

			<textarea
				ref={(node) => {
					props.ref?.(node);

					const getter = hasValue ? () => props.value : undefined;
					useTextareaAutosize(node, getter, {
						maxRows: props.maxRows,
						minRows: props.minRows,
					});
				}}
				id={id}
				required={props.required}
				disabled={isDisabled()}
				value={hasValue ? props.value : ''}
				onInput={props.onInput}
				placeholder={props.placeholder}
				class="resize-none rounded border border-outline-md bg-background px-3 py-2 text-sm leading-6 text-contrast outline-2 -outline-offset-2 outline-accent placeholder:text-contrast-muted focus:outline"
			/>

			{props.error && <p class="text-de text-error">{props.error}</p>}
		</div>
	);
};

export default TextareaInput;

export const CharCounter = (props: { value: number; max: number }) => {
	const isOver = createMemo(() => props.value > props.max);

	return (
		<span class={`text-de` + (!isOver() ? ` text-contrast-muted` : ` text-error`)}>
			{formatLong(props.value)}/{formatLong(props.max)}
		</span>
	);
};
