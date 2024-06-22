import type { Component, ParentProps } from 'solid-js';

import { useModalContext } from '~/globals/modals';

import { useModalClose } from '~/lib/hooks/modal-close';

export { Backdrop } from './dialog';

export interface SidebarContainerProps extends ParentProps {}

const SidebarContainer = (props: SidebarContainerProps) => {
	const { close, isActive } = useModalContext();

	const containerRef = (node: HTMLElement) => {
		useModalClose(node, close, isActive);
	};

	return (
		<div
			ref={containerRef}
			role="menu"
			class="z-1 flex w-72 grow flex-col self-start overflow-auto bg-background"
		>
			{props.children}
		</div>
	);
};

export { SidebarContainer as Container };

export interface SidebarItemProps {
	icon: Component;
	label: string;
	onClick?: () => void;
}

const SidebarItem = (props: SidebarItemProps) => {
	return (
		<button
			role="menuitem"
			onClick={props.onClick}
			class="flex gap-4 px-4 py-3 text-contrast hover:bg-contrast/md active:bg-contrast/sm-pressed"
		>
			<div class="mt-0.5 text-xl">
				{(() => {
					const Icon = props.icon;
					return <Icon />;
				})()}
			</div>

			<span class="text-base font-bold">{props.label}</span>
		</button>
	);
};

export { SidebarItem as Item };

export interface SidebarNavItemProps {
	icon: Component;
	label: string;
	href: string;
}

const SidebarNavItem = (props: SidebarNavItemProps) => {
	const { close } = useModalContext();

	return (
		<a
			role="menuitem"
			href={props.href}
			onClick={close}
			class="flex gap-4 px-4 py-3 text-contrast hover:bg-contrast/md active:bg-contrast/sm-pressed"
		>
			<div class="mt-0.5 text-xl">
				{(() => {
					const Icon = props.icon;
					return <Icon />;
				})()}
			</div>

			<span class="text-base font-bold">{props.label}</span>
		</a>
	);
};

export { SidebarNavItem as NavItem };
