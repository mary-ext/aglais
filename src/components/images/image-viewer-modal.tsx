import { createMemo, createSignal, onMount, Show } from 'solid-js';

import { useModalContext } from '~/globals/modals';

import { createDerivedSignal } from '~/lib/hooks/derived-signal';
import { createEventListener } from '~/lib/hooks/event-listener';
import { useMediaQuery } from '~/lib/hooks/media-query';
import { useModalClose } from '~/lib/hooks/modal-close';

import IconButton from '../icon-button';
import ArrowLeftOutlinedIcon from '../icons-central/arrow-left-outline';
import CrossLargeOutlinedIcon from '../icons-central/cross-large-outline';
import EyeOpenOutlinedIcon from '../icons-central/eye-open-outline';
import EyeSlashOutlinedIcon from '../icons-central/eye-slash-outline';

export interface Image {
	fullsize: string;
	alt?: string;
}

export interface ImageViewerModalProps {
	active?: number;
	images: Image[];
}

const enum GalleryNav {
	PREV,
	NEXT,
}

const ImageViewerModal = (props: ImageViewerModalProps) => {
	let scrollRef: HTMLDivElement;

	const { close, isActive } = useModalContext();

	const images = props.images;
	const initialActive = props.active ?? 0;

	const isDesktop = useMediaQuery('(width >= 688px) and (height >= 500px)');
	const isPointerCoarse = useMediaQuery('(pointer: coarse)');

	const [hidden, setHidden] = createDerivedSignal(() => (isPointerCoarse(), false));
	const [displayAlt, setDisplayAlt] = createSignal(true);

	const [active, setActive] = createSignal(initialActive);

	const [loading, setLoading] = createSignal(images.length);

	const hasNext = createMemo(() => active() < images.length - 1);
	const hasPrev = createMemo(() => active() > 0);

	const observer = new IntersectionObserver(
		(entries) => {
			for (let idx = 0, len = entries.length; idx < len; idx++) {
				const entry = entries[idx];

				if (entry.isIntersecting) {
					setActive((entry.target as any)._index);
					return;
				}
			}
		},
		{ threshold: 0.5 },
	);

	const bindImageWrapperRef = (index: number) => {
		return (node: HTMLElement) => {
			(node as any)._index = index;
			observer.observe(node);
		};
	};

	const handleImageWrapperClick = (_ev: MouseEvent) => {
		if (isPointerCoarse()) {
			setHidden(!hidden());
		} else {
			close();
		}
	};

	const bindNavClick = (nav: GalleryNav) => {
		return () => {
			const current = active();
			const delta = nav === GalleryNav.PREV ? -1 : 1;

			const next = current + delta;

			const children = [...scrollRef.childNodes];

			if (next < 0 || next > children.length - 1) {
				return;
			}

			const child = children[current + delta] as HTMLElement;

			child?.scrollIntoView({ inline: 'center' });
		};
	};

	onMount(() => {
		const children = [...scrollRef.childNodes];
		const child = children[active()] as HTMLElement;

		child.scrollIntoView({ inline: 'center', behavior: 'instant' });
	});

	createEventListener(document.body, 'keydown', (ev) => {
		const key = ev.key;

		if (key === 'ArrowLeft') {
			ev.preventDefault();
			bindNavClick(GalleryNav.PREV)();
		} else if (key === 'ArrowRight') {
			ev.preventDefault();
			bindNavClick(GalleryNav.NEXT)();
		}
	});

	return (
		<div
			ref={(node) => {
				useModalClose(node, close, isActive);
			}}
			class="h-full w-full overflow-hidden bg-black/80"
		>
			{loading() > 0 && (
				<div class="pointer-events-none absolute top-0 h-1 w-full">
					<div class="h-full w-1/4 animate-indeterminate bg-accent" />
				</div>
			)}

			<div
				ref={scrollRef!}
				class="flex h-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-contain scrollbar-hide"
			>
				{
					/* @once */ images.map(({ fullsize, alt }, index) => {
						let finished = false;

						const finish = () => {
							if (finished) {
								return;
							}

							finished = true;
							setLoading(loading() - 1);
						};

						return (
							<div
								ref={bindImageWrapperRef(index)}
								onClick={handleImageWrapperClick}
								class={
									`flex h-full w-full shrink-0 snap-center snap-always items-center justify-center py-6` +
									(isDesktop() ? ` px-6` : ``)
								}
							>
								<img
									src={fullsize}
									alt={alt}
									class="max-h-full max-w-full select-none"
									fetchpriority={index === initialActive ? 'high' : 'low'}
									draggable={false}
									onError={finish}
									onLoad={finish}
								/>
							</div>
						);
					})
				}
			</div>

			{(() => {
				if (!displayAlt()) {
					return;
				}

				const image = images[active()];
				const alt = image.alt;

				if (alt) {
					return (
						<div
							class="pointer-events-none absolute bottom-0 left-0 right-0 grid place-items-center transition-opacity"
							classList={{ [`opacity-0`]: hidden() }}
						>
							<div
								class={
									`pointer-events-auto max-h-44 max-w-120 overflow-y-auto bg-black/80 text-sm text-white` +
									(isDesktop() ? ` m-4 rounded-md px-3 py-2` : ` w-full px-4 py-3`) +
									(!hidden() ? ` pointer-events-auto` : ``)
								}
							>
								<p class="whitespace-pre-wrap break-words drop-shadow">{alt}</p>
							</div>
						</div>
					);
				}
			})()}

			<div
				class="pointer-events-none fixed inset-x-0 top-0 z-20 flex h-13 items-center gap-2 px-2.5 transition-opacity"
				classList={{ [`opacity-0`]: hidden() }}
			>
				<IconButton
					icon={CrossLargeOutlinedIcon}
					title="Close image viewer"
					onClick={close}
					variant="black"
					class={!hidden() ? `pointer-events-auto` : ``}
				/>

				{
					/* @once */ images.some((image) => !!image.alt) && (
						<button
							title="Toggle alternative text display"
							onClick={() => setDisplayAlt(!displayAlt())}
							class={
								'flex h-9 place-items-center rounded-full bg-p-neutral-950/75 px-3 text-white hover:bg-p-neutral-800/75 active:bg-p-neutral-700/75' +
								(!hidden() ? ` pointer-events-auto` : ``)
							}
						>
							<span class="pr-2 text-xs font-bold drop-shadow">ALT</span>

							{(() => {
								const Icon = !displayAlt() ? EyeSlashOutlinedIcon : EyeOpenOutlinedIcon;
								return <Icon class="text-lg drop-shadow" />;
							})()}
						</button>
					)
				}

				<div class="grow"></div>

				{
					/* @once */ images.length > 1 && (
						<div class="rounded-full bg-black/80 px-2 py-0.5 text-de font-medium text-white">
							<span class="drop-shadow">{`${active() + 1} of ${images.length}`}</span>
						</div>
					)
				}
			</div>

			<Show when={!isPointerCoarse()}>
				<Show when={hasPrev()}>
					<div class="fixed left-2.5 top-1/2 z-20 -translate-y-1/2">
						<IconButton
							icon={ArrowLeftOutlinedIcon}
							title="Show previous image"
							onClick={bindNavClick(GalleryNav.PREV)}
							variant="black"
							class="pointer-events-auto"
						/>
					</div>
				</Show>

				<Show when={hasNext()}>
					<div class="fixed right-2.5 top-1/2 z-20 -translate-y-1/2">
						<IconButton
							icon={() => <ArrowLeftOutlinedIcon class="rotate-180" />}
							title="Show previous image"
							onClick={bindNavClick(GalleryNav.NEXT)}
							variant="black"
							class="pointer-events-auto"
						/>
					</div>
				</Show>
			</Show>
		</div>
	);
};

export default ImageViewerModal;
