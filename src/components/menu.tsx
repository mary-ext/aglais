import { useFloating } from 'solid-floating-ui';
import { createSignal, type Component, type JSX } from 'solid-js';

import { flip, shift, size } from '@floating-ui/dom';
import { getSide, type Placement } from '@floating-ui/utils';

import { useModalContext } from '~/globals/modals';

import { useMediaQuery } from '~/lib/hooks/media-query';
import { useModalClose } from '~/lib/hooks/modal-close';
import { on } from '~/lib/misc';

import Button from './button';
import CheckOutlinedIcon from './icons-central/check-outline';

export interface MenuContainerProps {
	anchor: HTMLElement;
	placement?: Placement;
	cover?: boolean;
	children: JSX.Element;
}

const MenuContainer = (props: MenuContainerProps) => {
	const { close, isActive } = useModalContext();
	const isDesktop = useMediaQuery('(width >= 688px) and (height >= 500px)');

	const containerRef = (node: HTMLElement): void => {
		useModalClose(node, close, isActive);
	};

	return on(isDesktop, ($isDesktop) => {
		if ($isDesktop) {
			const [floating, setFloating] = createSignal<HTMLElement>();
			const position = useFloating(() => props.anchor, floating, {
				placement: props.placement ?? 'bottom-end',
				strategy: 'absolute',
				middleware: [
					props.cover && {
						name: 'offset',
						fn(state) {
							const reference = state.rects.reference;
							const x = state.x;
							const y = state.y;

							const multi = getSide(state.placement) === 'bottom' ? 1 : -1;

							return {
								x: x,
								y: y - reference.height * multi,
							};
						},
					},
					flip({
						padding: 16,
						crossAxis: false,
					}),
					shift({
						padding: 16,
					}),
					size({
						padding: 16,
						apply({ availableWidth, availableHeight, elements }) {
							Object.assign(elements.floating.style, {
								maxWidth: `${availableWidth}px`,
								maxHeight: `${availableHeight}px`,
							});
						},
					}),
				],
			});

			const ref = (node: HTMLElement) => {
				setFloating(node);
				containerRef(node);
			};

			return (
				<div
					ref={ref}
					role="menu"
					style={{ top: `${position.y ?? 0}px`, left: `${position.x ?? 0}px` }}
					class="absolute flex max-w-sm flex-col overflow-hidden overflow-y-auto rounded-md border border-outline bg-background"
				>
					{props.children}
				</div>
			);
		} else {
			return (
				<div class="flex grow flex-col self-stretch overflow-y-auto bg-contrast-overlay/40">
					<div class="h-[40dvh] shrink-0"></div>
					<div ref={containerRef} role="menu" class="mt-auto flex flex-col bg-background">
						<div class="flex flex-col pt-1">{props.children}</div>

						<div class="flex flex-col px-4 pb-4 pt-3">
							<Button onClick={close} size="md">
								Cancel
							</Button>
						</div>
					</div>
				</div>
			);
		}
	}) as unknown as JSX.Element;
};

export { MenuContainer as Container };

export interface MenuItemProps {
	icon?: Component;
	label: string;
	variant?: 'default' | 'danger';
	disabled?: boolean;
	checked?: boolean;
	onClick?: () => void;
}

const MenuItem = (props: MenuItemProps) => {
	const hasIcon = 'icon' in props;
	const hasChecked = 'checked' in props;

	return (
		<button role="menuitem" disabled={props.disabled} onClick={props.onClick} class={menuItemClasses(props)}>
			{hasIcon && (
				<div class="mt-0.5 text-lg">
					{(() => {
						const Icon = props.icon;
						return Icon && <Icon />;
					})()}
				</div>
			)}

			<span class="grow text-sm font-bold">{props.label}</span>

			{hasChecked && (
				<CheckOutlinedIcon
					class={'-my-0.5 -mr-1 shrink-0 text-2xl text-accent' + (!props.checked ? ` invisible` : ``)}
				/>
			)}
		</button>
	);
};
const menuItemClasses = ({ variant = 'default', disabled }: MenuItemProps) => {
	let cn = `flex gap-3 px-4 py-3 text-left `;

	if (disabled) {
		cn += ` opacity-50`;
	}

	if (variant === 'default') {
		cn += ` text-contrast`;

		if (!disabled) {
			cn += ` hover:bg-contrast/sm active:bg-contrast/sm-pressed`;
		}
	} else if (variant === 'danger') {
		cn += ` text-p-red-600`;

		if (!disabled) {
			cn += ` hover:bg-contrast/sm active:bg-contrast/sm-pressed`;
		}
	}

	return cn;
};

export { MenuItem as Item };
