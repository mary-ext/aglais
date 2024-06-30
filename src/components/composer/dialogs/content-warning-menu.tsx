import { createMemo } from 'solid-js';

import { useModalContext } from '~/globals/modals';

import * as Menu from '../../menu';

export interface ContentWarningMenuProps {
	anchor: HTMLElement;
	value: string[];
	onChange: (next: string[]) => void;
}

const ContentWarningMenu = (props: ContentWarningMenuProps) => {
	const onChange = props.onChange;

	const { close } = useModalContext();
	const value = createMemo(() => {
		const $labels = props.value;
		return $labels.length !== 0 ? $labels[0] : undefined;
	});

	return (
		<Menu.Container anchor={props.anchor} placement="bottom-start" cover>
			<div class="px-4 py-3">
				<p class="text-sm font-bold">Content warning</p>
				<p class="text-de text-contrast-muted">Choose the category suitable for this media</p>
			</div>

			<Menu.Item
				label="None"
				checked={value() === undefined}
				onClick={() => {
					close();
					onChange([]);
				}}
			/>
			<Menu.Item
				label="Adult content"
				checked={value() === 'porn'}
				onClick={() => {
					close();
					onChange(['porn']);
				}}
			/>
			<Menu.Item
				label="Sexually suggestive"
				checked={value() === 'sexual'}
				onClick={() => {
					close();
					onChange(['sexual']);
				}}
			/>
			<Menu.Item
				label="Nudity"
				checked={value() === 'nudity'}
				onClick={() => {
					close();
					onChange(['nudity']);
				}}
			/>
			<Menu.Item
				label="Graphic media"
				checked={value() === 'graphic-media'}
				onClick={() => {
					close();
					onChange(['graphic-media']);
				}}
			/>
		</Menu.Container>
	);
};

export default ContentWarningMenu;
