import type { JSX } from 'solid-js';

import { createId } from '~/lib/hooks/id';

import { useFieldset } from './fieldset';
import CheckOutlinedIcon from './icons-central/check-outline';

export interface CheckboxInputProps {
	ref?: (node: HTMLInputElement) => void;
	label: string;
	description?: string;
	disabled?: boolean;
	checked?: boolean;
	onInput?: JSX.InputEventHandler<HTMLInputElement, InputEvent>;
}

const CheckboxInput = (props: CheckboxInputProps) => {
	const fieldset = useFieldset();
	const id = createId();

	const isDisabled = () => fieldset.disabled || !!props.disabled;

	return (
		<div class={`flex items-start gap-3` + (isDisabled() ? ` opacity-50` : ``)}>
			<label class="relative inline-flex cursor-pointer">
				<input
					ref={(node) => props.ref?.(node)}
					type="checkbox"
					id={id}
					disabled={isDisabled()}
					checked={props.checked}
					onInput={props.onInput}
					class="peer h-0 w-0 appearance-none leading-none outline-none"
				/>

				<div class="pointer-events-none absolute -inset-2 rounded-full outline-2 -outline-offset-2 outline-accent peer-hover:bg-contrast/md peer-focus-visible:outline peer-disabled:hidden" />

				<div class="z-10 h-5 w-5 rounded border-2 border-outline-md bg-background peer-checked:hidden peer-disabled:opacity-50"></div>
				<div class="z-10 hidden h-5 w-5 place-items-center rounded bg-accent peer-checked:grid peer-disabled:opacity-50">
					<CheckOutlinedIcon class="stroke-white stroke-1 text-xl text-white" />
				</div>
			</label>

			<div class="min-w-0 grow">
				<label for={id} class="block break-words text-sm font-medium">
					{props.label}
				</label>
				<p class="mt-0.5 text-pretty text-de text-contrast-muted empty:hidden">{props.description}</p>
			</div>
		</div>
	);
};

export default CheckboxInput;
