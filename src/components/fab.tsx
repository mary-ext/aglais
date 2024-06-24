import type { Component } from 'solid-js';

export interface FABProps {
	label: string;
	icon: Component;
	onClick?: () => void;
}

const FAB = (props: FABProps) => {
	return (
		<div class="flex w-full justify-end">
			<div class="fixed bottom-13 z-2 pb-4 pr-4">
				<button
					title={props.label}
					onClick={props.onClick}
					class="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-xl text-accent-fg shadow-sm shadow-black hover:bg-accent-hover active:bg-accent-active"
				>
					{(() => {
						const Icon = props.icon;
						return <Icon />;
					})()}
				</button>
			</div>
		</div>
	);
};

export default FAB;
