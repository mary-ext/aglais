import type { Component } from 'solid-js';

export interface FABProps {
	label: string;
	icon: Component;
	onClick?: () => void;
}

const FAB = (props: FABProps) => {
	return (
		<button title={props.label} class={fabClassNames()}>
			{(() => {
				const Icon = props.icon;
				return <Icon />;
			})()}
		</button>
	);
};

export default FAB;

const fabClassNames = (): string => {
	let cn = `flex h-12 w-12 items-center justify-center`;

	cn += ` bg-accent text-accent-fg hover:bg-accent-hover active:bg-accent-active`;

	return cn;
};
