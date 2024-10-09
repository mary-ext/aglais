import { For, Suspense, onCleanup } from 'solid-js';

import { INTERNAL_ModalContext, INTERNAL_modals, type ModalContext, closeModal } from '~/globals/modals';

let isScrollbarSizeDetermined = false;

const ModalRenderer = () => {
	return (
		<For each={INTERNAL_modals()}>
			{({ id, render }) => {
				const context: ModalContext = {
					id: id,
					isActive(): boolean {
						const array = INTERNAL_modals();
						const last = array[array.length - 1];
						return last !== undefined && last.id === id;
					},
					close(): void {
						return closeModal(id);
					},
				};

				// Restore focus
				{
					const focused = document.activeElement;
					if (focused !== null && focused !== document.body) {
						onCleanup(() => {
							queueMicrotask(() => {
								if (document.contains(focused)) {
									(focused as any).focus();
								}
							});
						});
					}
				}

				// Determine scrollbar size
				if (!isScrollbarSizeDetermined) {
					determineScrollbarSize();
					isScrollbarSizeDetermined = true;
				}

				return (
					<INTERNAL_ModalContext.Provider value={context}>
						<div
							inert={!context.isActive()}
							class="fixed inset-0 flex flex-col items-center justify-start overflow-hidden"
							data-modal
						>
							<Suspense fallback={<FallbackLoader />}>{render(context)}</Suspense>
						</div>
					</INTERNAL_ModalContext.Provider>
				);
			}}
		</For>
	);
};

export default ModalRenderer;

const FallbackLoader = () => {
	return (
		<>
			{/* <Dialog.Backdrop> */}
			<div class="fixed inset-0 z-0 bg-contrast-overlay/40"></div>
			<div class="grid grow place-items-center">
				{/* <CircularProgress> */}
				<svg viewBox="0 0 32 32" class="animate-spin" style="height:24px;width:24px">
					<circle cx="16" cy="16" fill="none" r="14" stroke-width="4" class="stroke-accent opacity-20" />
					<circle
						cx="16"
						cy="16"
						fill="none"
						r="14"
						stroke-width="4"
						stroke-dasharray="80px"
						stroke-dashoffset="60px"
						class="stroke-accent"
					/>
				</svg>
			</div>
		</>
	);
};

const determineScrollbarSize = () => {
	const docEl = document.documentElement;

	const documentWidth = docEl.clientWidth;
	const scrollbarSize = Math.abs(window.innerWidth - documentWidth);

	docEl.style.setProperty('--sb-width', `${scrollbarSize}px`);
};
