import { createIcon } from './_icon';

// triangle-exclamation
const ProblemOutlinedIcon = createIcon(() => (
	<svg width="1em" height="1em" fill="none" viewBox="0 0 24 24">
		<path
			stroke="currentColor"
			stroke-linecap="square"
			stroke-width="2"
			d="M12 16v-.01M12 10v3m0-10L2.5 19h19L12 3Z"
		/>
	</svg>
));

export default ProblemOutlinedIcon;
