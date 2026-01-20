import { type JSX, onMount } from 'solid-js';

import { useModalContext } from '~/globals/modals';

import { createEventListener } from '~/lib/hooks/event-listener';
import { useModalClose } from '~/lib/hooks/modal-close';

export interface DrawerContainerProps {
	maxWidth?: string;
	maxHeight?: string;
	children: JSX.Element;
}

/**
 * mobile drawer container with scroll snap, slide animations, and drag handle
 */
const DrawerContainer = (props: DrawerContainerProps) => {
	const { close, isActive } = useModalContext();

	const hasReducedMotion = false && matchMedia('(prefers-reduced-motion)').matches;
	const hasScrollSnapEvent = 'onscrollsnapchange' in window;

	const maxWidth = () => props.maxWidth ?? '540px';
	const maxHeight = () => props.maxHeight ?? '60svh';

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
			<div
				class="relative shrink-0 grow"
				style={{ 'max-height': maxHeight(), width: maxWidth(), 'max-width': '100%' }}
			>
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

					<div class="flex min-h-0 grow flex-col overflow-y-auto">{props.children}</div>
				</div>
			</div>
			<div class="h-svh w-full shrink-0 grow"></div>
		</div>
	);
};

export { DrawerContainer as Container };
