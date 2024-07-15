import { createMemo } from 'solid-js';

import CheckOutlinedIcon from './icons-central/check-outline';

export interface FilterOption<T> {
	value: T;
	label: string;
}

export interface FilterBarProps<T> {
	value: T;
	options: FilterOption<T>[];
	onChange: (next: T) => void;
}

const FilterBar = <T,>(props: FilterBarProps<T>) => {
	const onChange = props.onChange;

	return (
		<div class="flex flex-wrap gap-3 px-4 py-3">
			{props.options.map((option) => {
				const isSelected = createMemo(() => props.value === option.value);

				return (
					<button
						class={
							'flex h-8 min-w-0 cursor-pointer items-center gap-1 rounded-md border px-3 text-left text-sm font-medium outline-2 -outline-offset-2 outline-accent focus-visible:outline disabled:pointer-events-none disabled:opacity-50' +
							(!isSelected()
								? ` border-outline-md hover:bg-contrast/md active:bg-contrast/sm-pressed`
								: ` border-transparent bg-contrast/15`)
						}
						onClick={() => !isSelected() && onChange(option.value)}
					>
						{isSelected() && <CheckOutlinedIcon class="-ml-1 text-xl" />}
						{option.label}
					</button>
				);
			})}
		</div>
	);
};

export default FilterBar;
