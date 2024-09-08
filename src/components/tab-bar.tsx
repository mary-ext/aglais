export interface TabBarProps<T extends string | number | boolean> {
	value: T;
	items: { value: T; label: string }[];
	onChange: (next: T) => void;
}

const TabBar = <T extends string | number | boolean>(props: TabBarProps<T>) => {
	return (
		<div class="flex h-13 shrink-0 overflow-x-auto border-b border-outline">
			{props.items.map(({ value, label }) => (
				<button
					onClick={() => props.onChange(value)}
					class={
						`outline-primary group flex h-full min-w-14 shrink-0 grow justify-center whitespace-nowrap px-4 text-sm font-bold outline-2 -outline-offset-2 hover:bg-contrast/sm-pressed focus-visible:outline active:bg-contrast/md` +
						(props.value === value ? ` is-active text-contrast` : ` text-contrast-muted`)
					}
				>
					<div class="relative flex h-full w-max items-center">
						<span>{label}</span>
						<div class="absolute -inset-x-1 bottom-0 hidden h-1 rounded bg-accent group-[.is-active]:block" />
					</div>
				</button>
			))}
		</div>
	);
};

export default TabBar;
