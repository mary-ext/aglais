import { createSignal } from 'solid-js';

import { createDerivedSignal } from '~/lib/hooks/derived-signal';

import CrossLargeOutlinedIcon from '../icons-central/cross-large-outline';
import MagnifyingGlassOutlinedIcon from '../icons-central/magnifying-glass-outline';

export interface SearchBarProps {
	value?: string;
	onEnter?: (next: string, reset: () => void) => void;
}

const SearchBar = (props: SearchBarProps) => {
	const [search, setSearch] = createDerivedSignal(() => props.value ?? '');
	const [focused, setFocused] = createSignal(false);

	const reset = () => setSearch(props.value ?? '');

	return (
		<form
			onSubmit={(ev) => {
				ev.preventDefault();
				props.onEnter?.(search(), reset);
			}}
			class="relative grow"
		>
			<div
				onFocusIn={() => setFocused(true)}
				onFocusOut={(ev) => setFocused(ev.currentTarget.contains(ev.relatedTarget as HTMLElement))}
				class="flex h-7.5 items-center gap-3 rounded-full bg-contrast/10 px-3 outline-2 outline-accent focus-within:bg-background focus-within:outline"
			>
				<input
					value={search()}
					onInput={(ev) => setSearch(ev.target.value)}
					placeholder="Search"
					class="grow self-stretch bg-transparent text-sm text-contrast outline-none placeholder:text-contrast-muted"
				/>

				{focused() && search() ? (
					<button
						type="button"
						tabindex={-1}
						onClick={() => setSearch('')}
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
