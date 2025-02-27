import { type JSX, Show } from 'solid-js';
import { Portal } from 'solid-js/web';

export interface DraggablePreviewProps {
	container: HTMLElement | undefined;
	children: JSX.Element;
}

const DraggablePreview = (props: DraggablePreviewProps) => {
	return (
		<Show when={props.container} keyed>
			{(container) => <Portal mount={container}>{props.children}</Portal>}
		</Show>
	);
};

export default DraggablePreview;
