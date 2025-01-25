import { createSignal, onMount } from 'solid-js';

import CrossLargeOutlinedIcon from '~/components/icons-central/cross-large-outline';
import MagnifyingGlassOutlinedIcon from '~/components/icons-central/magnifying-glass-outline';

import { useSearchBar } from '../search/context';

export interface SearchBarProps {
	autofocus?: boolean;
}

const SearchBar = (props: SearchBarProps) => {
	const { query, setInputEl, setQuery, onFocus, onSearch } = useSearchBar();

	const [focused, setFocused] = createSignal(false);

	let inputEl: HTMLInputElement;

	return (
		<form
			onSubmit={(ev) => {
				const $query = query();

				ev.preventDefault();

				if ($query.trim()) {
					onSearch($query);
				}
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
						setInputEl((inputEl = el));

						onMount(() => {
							if (props.autofocus) {
								el.focus();
							}
						});
					}}
					value={query()}
					onInput={(ev) => setQuery(ev.target.value.trimStart())}
					onClick={onFocus}
					placeholder="Search"
					class="grow self-stretch bg-transparent text-sm text-contrast outline-none placeholder:text-contrast-muted"
				/>

				{focused() && query() ? (
					<button
						type="button"
						tabindex={-1}
						onClick={() => {
							inputEl.focus();

							inputEl.setSelectionRange(0, inputEl.value.length);
							document.execCommand('insertText', false, '');
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
