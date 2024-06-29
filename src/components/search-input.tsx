import { autofocusIfEnabled, modelText } from '~/lib/input-refs';

import MagnifyingGlassOutlinedIcon from './icons-central/magnifying-glass-outline';

export interface SearchInputProps {
	value: string;
	onChange: (next: string) => void;
	placeholder?: string;
	autofocus?: boolean;
}

const SearchInput = (props: SearchInputProps) => {
	return (
		<div class="relative h-max grow">
			<div class="pointer-events-none absolute inset-y-0 ml-px grid w-10 place-items-center">
				<MagnifyingGlassOutlinedIcon class="text-lg text-contrast-muted" />
			</div>

			<input
				ref={(node) => {
					modelText(node, () => props.value, props.onChange);

					if ('autofocus' in props) {
						autofocusIfEnabled(node, () => props.autofocus ?? false);
					}
				}}
				type="text"
				placeholder={props.placeholder ?? `Search`}
				class="h-10 w-full rounded-full border border-outline-md bg-background px-3 pl-10 text-sm text-contrast outline-2 -outline-offset-2 outline-accent placeholder:text-contrast-muted focus:outline"
			/>
		</div>
	);
};

export default SearchInput;
