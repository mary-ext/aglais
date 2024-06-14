import { type ComponentProps, type JSX } from 'solid-js';
import { spread } from 'solid-js/web';

/*#__NO_SIDE_EFFECTS__*/
export const createIcon = (path: () => JSX.Element) => {
	// @ts-expect-error
	return Icon.bind(path);
};

function Icon(this: () => Element, props: ComponentProps<'svg'>) {
	const svg = this();
	spread(svg, props, true, true);

	return svg;
}
