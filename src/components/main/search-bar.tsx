import { createSignal } from 'solid-js';

import CrossLargeOutlinedIcon from '../icons-central/cross-large-outline';
import MagnifyingGlassOutlinedIcon from '../icons-central/magnifying-glass-outline';

export interface SearchBarProps {
	value?: string;
	onChange?: (next: string) => void;
	onClick?: () => void;
	onKeyDown?: (ev: KeyboardEvent) => void;
	onSubmit?: () => void;
}

const SearchBar = (props: SearchBarProps) => {
	const onChange = props.onChange;
	const onClick = props.onClick;
	const onKeyDown = props.onKeyDown;
	const onSubmit = props.onSubmit;

	const [focused, setFocused] = createSignal(false);

	let inputEl: HTMLInputElement;

	return (
		<form
			onSubmit={(ev) => {
				ev.preventDefault();
				onSubmit?.();
			}}
			class="relative grow"
		>
			<div
				onFocusIn={() => setFocused(true)}
				onFocusOut={(ev) => setFocused(ev.currentTarget.contains(ev.relatedTarget as HTMLElement))}
				class="flex h-7.5 items-center gap-3 rounded-full bg-contrast/10 px-3 outline-2 outline-accent focus-within:bg-background focus-within:outline"
			>
				<input
					ref={(el) => {
						inputEl = el;
					}}
					value={props.value ?? ''}
					onInput={onChange && ((ev) => onChange(ev.target.value.trimStart()))}
					onClick={onClick}
					onKeyDown={onKeyDown}
					placeholder="Search"
					class="grow self-stretch bg-transparent text-sm text-contrast outline-none placeholder:text-contrast-muted"
				/>

				{onChange && focused() && props.value ? (
					<button
						type="button"
						tabindex={-1}
						onClick={() => {
							onChange('');
							inputEl!.focus();
						}}
						class="text-contrast-muted outline-none hover:text-contrast"
					>
						<CrossLargeOutlinedIcon class="text-lg" />
					</button>
				) : (
					<MagnifyingGlassOutlinedIcon class="text-lg text-contrast-muted" />
				)}
			</div>

			<input type="submit" hidden />
		</form>
	);
};

export default SearchBar;
