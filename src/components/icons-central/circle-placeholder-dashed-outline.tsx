import { createIcon } from './_icon';

const CirclePlaceholderDashedOutlinedIcon = createIcon(() => (
	<svg width="1em" height="1em" fill="none" viewBox="0 0 24 24">
		<path
			stroke="currentColor"
			stroke-dasharray="2 4"
			stroke-linecap="square"
			stroke-linejoin="round"
			stroke-width="2"
			d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
		/>
	</svg>
));

export default CirclePlaceholderDashedOutlinedIcon;
