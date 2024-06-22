type Gutter = false | 'sm' | 'md';

export interface DividerProps {
	gutter?: Gutter;
	gutterTop?: Gutter;
	gutterBottom?: Gutter;
}

const Divider = (props: DividerProps) => {
	return <hr class={dividerClassNames(props)} />;
};

const dividerClassNames = ({ gutter = false, gutterBottom = gutter, gutterTop = gutter }: DividerProps) => {
	let cn = `border-outline`;

	if (gutterBottom === 'sm') {
		cn += ` mb-1`;
	} else if (gutterBottom === 'md') {
		cn += ` mb-3`;
	}

	if (gutterTop === 'sm') {
		cn += ` mt-1`;
	} else if (gutterTop === 'md') {
		cn += ` mt-3`;
	}

	return cn;
};

export default Divider;
