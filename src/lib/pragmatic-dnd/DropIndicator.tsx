import type { Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/types';
import { createMemo } from 'solid-js';

import Keyed from '~/components/keyed';

export interface DropIndicatorProps {
	edge: Edge | undefined;
	gap?: string;
	thickness?: string;
}

type Orientation = 'horizontal' | 'vertical';

const edgeToOrientation: Record<Edge, Orientation> = {
	top: 'horizontal',
	bottom: 'horizontal',
	left: 'vertical',
	right: 'vertical',
};

const orientationStyles: Record<Orientation, string> = {
	horizontal: 'left-2 right-2',
	vertical: 'top-2 bottom-2',
};

const DropIndicator = (props: DropIndicatorProps) => {
	return (
		<Keyed value={props.edge != null}>
			{(isVisible) => {
				if (!isVisible) {
					return null;
				}

				const gap = createMemo(() => props.gap || '0px');
				const thickness = createMemo(() => props.thickness || '3px');

				const orientation = createMemo((): Orientation => {
					const edge = props.edge;
					if (edge == null) {
						return 'horizontal';
					}

					return edgeToOrientation[edge];
				});

				return (
					<div
						class={`pointer-events-none absolute z-10 rounded bg-accent ` + orientationStyles[orientation()]}
						style={{
							[props.edge!]: `calc(-0.5 * (${gap()} + ${thickness()}))`,
							[orientation() === 'horizontal' ? 'height' : 'width']: thickness(),
						}}
					></div>
				);
			}}
		</Keyed>
	);
};

export default DropIndicator;
