import CheckOutlinedIcon from './icons-central/check-outline';

export interface AltButtonProps {
	checked?: boolean;
	title: string;
	onClick?: () => void;
}

const AltButton = (props: AltButtonProps) => {
	return (
		<button
			title={props.title}
			onClick={props.onClick}
			class="flex h-5 items-center gap-0.5 rounded bg-p-neutral-950/75 px-1 text-xs font-bold tracking-wider text-white hover:bg-p-neutral-800/75 active:bg-p-neutral-700/75"
		>
			<span>ALT</span>
			{props.checked && <CheckOutlinedIcon class="-mr-1 text-lg text-p-green-600" />}
		</button>
	);
};

export default AltButton;
