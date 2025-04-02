import { flip, shift, size } from '@floating-ui/dom';
import { type Placement, getSide } from '@floating-ui/utils';
import { useFloating } from 'solid-floating-ui';
import { type Component, type JSX, createSignal, onMount } from 'solid-js';

import { useModalContext } from '~/globals/modals';

import { createEventListener } from '~/lib/hooks/event-listener';
import { useMediaQuery } from '~/lib/hooks/media-query';
import { useModalClose } from '~/lib/hooks/modal-close';
import { on } from '~/lib/utils/misc';

import Divider from './divider';
import CheckOutlinedIcon from './icons-central/check-outline';

export interface MenuContainerProps {
	anchor: HTMLElement;
	placement?: Placement;
	cover?: boolean;
	children: JSX.Element;
}

const MenuContainer = (props: MenuContainerProps) => {
	const { close, isActive } = useModalContext();
	const isDesktop = useMediaQuery('((width >= 688px) and (height >= 500px)) or (pointer: fine)');

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

				useModalClose(node, close, isActive);

				requestAnimationFrame(() => {
					const found = node.querySelector('[role^=menuitem]');
					// @ts-expect-error
					found?.focus();
				});
			};

			return (
				<div
					ref={ref}
					role="menu"
					onKeyDown={onKeyDown}
					style={{ top: `${position.y ?? 0}px`, left: `${position.x ?? 0}px` }}
					class="absolute flex max-w-sm flex-col overflow-hidden overflow-y-auto rounded-md border border-outline bg-background"
				>
					{props.children}
				</div>
			);
		} else {
			const hasReducedMotion = false && matchMedia('(prefers-reduced-motion)').matches;
			const hasScrollSnapEvent = 'onscrollsnapchange' in window;

			return (
				<div
					ref={(node) => {
						if (hasScrollSnapEvent) {
							createEventListener(node, 'scrollsnapchange', () => {
								if (node.scrollTop < 0) {
									close();
								}
							});
						} else {
							onMount(() => {
								const content = node.firstElementChild!;

								createEventListener(node, 'scroll', () => {
									if (-node.scrollTop > content.clientHeight - 2) {
										close();
									}
								});
							});
						}
					}}
					class="flex grow snap-y snap-mandatory flex-col-reverse items-center self-stretch overflow-y-auto overscroll-none bg-contrast-overlay/75 scrollbar-hide"
				>
					<div class="relative max-h-[60svh] w-[540px] max-w-full shrink-0 grow">
						<div class="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between">
							<div class="h-12 w-full -translate-y-full snap-end"></div>
							<div class="h-12 w-full snap-end"></div>
						</div>

						<div
							ref={(node) => {
								if (!hasReducedMotion) {
									let closing = false;

									onMount(() => {
										const easing = 'cubic-bezier(0.32, 0.72, 0, 1)';
										const duration = 350;

										const handleClose = () => {
											if (closing) {
												return;
											}

											const anim = node.animate([{ translate: '0 0' }, { translate: '0 100%' }], {
												easing,
												duration,
											});

											closing = true;
											anim.finished.then(close);
										};

										node.animate([{ translate: '0 100%' }, { translate: '0 0' }], { easing, duration });

										useModalClose(node, handleClose, isActive);
									});
								} else {
									useModalClose(node, close, isActive);
								}
							}}
							class="flex h-full w-full flex-col overflow-clip rounded-t-lg bg-background pt-6 shadow-lg"
						>
							<div class="absolute inset-x-0 top-0 grid h-6 place-items-center">
								<div class="h-1 w-12 rounded-full bg-contrast/20"></div>
							</div>

							<div class="flex flex-col overflow-y-auto pb-3 text-sm">{props.children}</div>
						</div>
					</div>
					<div class="h-svh w-full shrink-0 grow"></div>
				</div>
			);
		}
	}) as unknown as JSX.Element;
};

const onKeyDown: JSX.EventHandler<HTMLElement, KeyboardEvent> = (ev) => {
	const key = ev.key;
	const node = ev.currentTarget;

	if (key === 'ArrowDown') {
		const found = getSibling(node, true);

		ev.preventDefault();
		found?.focus();
	} else if (key === 'ArrowUp') {
		const found = getSibling(node, false);

		ev.preventDefault();
		found?.focus();
	}
};

const getSibling = (node: Element, next: boolean): HTMLElement | null => {
	const options = Array.from(
		node.querySelectorAll<HTMLElement>('[role^="menuitem"]:not([hidden]):not([disabled])'),
	);

	const selected = document.activeElement;
	const index = selected instanceof HTMLElement ? options.indexOf(selected) : -1;

	return (
		(next ? options[index + 1] : options[index - 1]) || (next ? options[0] : options[options.length - 1])
	);
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
	let cn = `flex gap-3 px-4 py-3 text-left outline-2 -outline-offset-2 outline-accent focus-visible:outline `;

	if (disabled) {
		cn += ` opacity-50`;
	}

	if (variant === 'default') {
		cn += ` text-contrast`;

		if (!disabled) {
			cn += ` hover:bg-contrast/sm active:bg-contrast/sm-pressed`;
		}
	} else if (variant === 'danger') {
		cn += ` text-error`;

		if (!disabled) {
			cn += ` hover:bg-contrast/sm active:bg-contrast/sm-pressed`;
		}
	}

	return cn;
};

export { MenuItem as Item };

export interface MenuDividerProps {}

const MenuDivider = ({}: MenuDividerProps) => {
	const isDesktop = useMediaQuery('(width >= 688px) and (height >= 500px)');

	return <Divider gutter={isDesktop() ? undefined : 'md'} class="mx-4" />;
};

export { MenuDivider as Divider };
