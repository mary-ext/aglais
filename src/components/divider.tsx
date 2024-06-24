type Gutter = false | 'sm' | 'md';

export interface DividerProps {
	gutter?: Gutter;
	gutterTop?: Gutter;
	gutterBottom?: Gutter;
	class?: string;
}

const Divider = (props: DividerProps) => {
	return <hr class={dividerClassNames(props)} />;
};

const dividerClassNames = ({
	gutter = false,
	gutterBottom = gutter,
	gutterTop = gutter,
	class: className,
}: DividerProps) => {
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

	if (className) {
		return `${cn} ${className}`;
	}

	return cn;
};

export default Divider;
