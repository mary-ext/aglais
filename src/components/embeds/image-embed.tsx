import type { AppBskyEmbedImages } from '@atcute/client/lexicons';

import { openModal } from '~/globals/modals';

import ImageViewerModalLazy from '../images/image-viewer-modal-lazy';

export interface ImageEmbedProps {
	/** Expected to be static */
	embed: AppBskyEmbedImages.View;
	blur?: boolean;
	/** Expected to be static */
	borderless?: boolean;
	/** Expected to be static */
	standalone?: boolean;
	/** Expected to be static */
	interactive?: boolean;
}

const enum RenderMode {
	MULTIPLE,
	MULTIPLE_SQUARE,
	STANDALONE,
}

const ImageEmbed = (props: ImageEmbedProps) => {
	if (props.standalone) {
		return StandaloneRenderer(props);
	}

	return NonStandaloneRenderer(props);
};

export default ImageEmbed;

const clamp = (value: number, min: number, max: number): number => {
	return Math.max(min, Math.min(max, value));
};

const isCloseToThreeByFour = (ratio: number): boolean => {
	return Math.abs(ratio - 3 / 4) < 0.01;
};

const isCloseToFourByThree = (ratio: number): boolean => {
	return Math.abs(ratio - 4 / 3) < 0.01;
};

const getClampedAspectRatio = (image: AppBskyEmbedImages.ViewImage) => {
	const dims = image.aspectRatio;

	const width = dims ? dims.width : 1;
	const height = dims ? dims.height : 1;
	const ratio = width / height;

	return clamp(ratio, 3 / 4, 4 / 3);
};

const deriveMultiMediaHeight = (ratioA: number, ratioB: number) => {
	if (isCloseToFourByThree(ratioA) && isCloseToFourByThree(ratioB)) {
		return 184;
	}

	if (
		(isCloseToThreeByFour(ratioA) && isCloseToFourByThree(ratioB)) ||
		(isCloseToThreeByFour(ratioA) && isCloseToThreeByFour(ratioB))
	) {
		return 235;
	}

	return ratioA === 1 && ratioB === 1 ? 245 : 200;
};

const StandaloneRenderer = (props: ImageEmbedProps) => {
	const { embed } = props;

	const images = embed.images;
	const length = images.length;

	if (length === 1) {
		const image = images[0];
		const dims = image.aspectRatio;

		const width = dims ? dims.width : 16;
		const height = dims ? dims.height : 9;
		const ratio = width / height;

		return (
			<div class="max-w-full self-start overflow-hidden rounded-md border border-outline">
				<div class="max-h-80 min-h-16 min-w-16" style={{ 'aspect-ratio': ratio }}>
					<img src={/* @once */ image.thumb} class="h-full w-full object-contain text-[0px]" />

					{/* beautiful hack that ensures we're always using the maximum possible dimension */}
					<div class="h-screen w-screen"></div>
				</div>
			</div>
		);
	}

	if (length === 2) {
		const a = images[0];
		const b = images[1];

		const ratioA = getClampedAspectRatio(a);
		const ratioB = getClampedAspectRatio(b);
		const totalRatio = ratioA + ratioB;

		return (
			<div
				class="grid gap-1.5"
				style={{
					'aspect-ratio': totalRatio,
					'grid-template-columns': `minmax(0, ${Math.floor(ratioA * 100)}fr) minmax(0, ${Math.floor(ratioB * 100)}fr)`,
				}}
			>
				<div class="overflow-hidden rounded-md border border-outline">
					<img src={/* @once */ a.thumb} class="h-full w-full object-cover text-[0px]" />
				</div>
				<div class="overflow-hidden rounded-md border border-outline">
					<img src={/* @once */ b.thumb} class="h-full w-full object-cover text-[0px]" />
				</div>
			</div>
		);
	}

	if (length >= 3) {
		const ratios = images.map(getClampedAspectRatio);

		const height = deriveMultiMediaHeight(ratios[0], ratios[1]);
		const widths = ratios.map((ratio) => Math.floor(ratio * height));

		const nodes = images.map((img, idx) => {
			const h = `${height}px`;
			const w = `${widths[idx]}px`;
			const r = ratios[idx];

			return (
				<div
					class="box-content shrink-0 overflow-hidden rounded-md border border-outline"
					style={{ height: h, width: w, 'aspect-ratio': r }}
				>
					<img src={/* @once */ img.thumb} class="h-full w-full object-cover text-[0px]" />
				</div>
			);
		});

		return <div class="-mx-4 flex gap-1.5 overflow-x-auto px-4">{nodes}</div>;
	}

	return null;
};

const NonStandaloneRenderer = (props: ImageEmbedProps) => {
	const { embed, borderless, interactive } = props;

	const images = embed.images;
	const length = images.length;

	const render = (index: number, mode: RenderMode) => {
		const { alt, thumb } = images[index];

		let cn: string | undefined;
		let ratio: string | undefined;

		if (mode === RenderMode.MULTIPLE) {
			cn = `min-h-0 grow basis-0 overflow-hidden`;
		} else if (mode === RenderMode.MULTIPLE_SQUARE) {
			cn = `aspect-square overflow-hidden`;
		} else if (mode === RenderMode.STANDALONE) {
			cn = `aspect-video overflow-hidden`;
		}

		return (
			<div class={`relative bg-background ` + cn} style={{ 'aspect-ratio': ratio }}>
				<img
					src={thumb}
					title={alt}
					class={
						`h-full w-full object-contain text-[0px]` +
						(interactive ? ` cursor-pointer` : ``) +
						// prettier-ignore
						(props.blur ? ` scale-125` + (!borderless ? ` blur` : ` blur-lg`) : ``)
					}
					onClick={() => {
						if (interactive) {
							openModal(() => <ImageViewerModalLazy active={index} images={images} />);
						}
					}}
				/>

				{interactive && alt && (
					<div class="pointer-events-none absolute bottom-0 right-0 p-2">
						<div class="flex h-4 items-center rounded bg-p-neutral-950/60 px-1 text-[9px] font-bold tracking-wider text-white">
							ALT
						</div>
					</div>
				)}
			</div>
		);
	};

	return (
		<div class={`` + (!borderless ? ` overflow-hidden rounded-md border border-outline` : ``)}>
			{length === 4 ? (
				<div class="flex gap-0.5">
					<div class="flex grow basis-0 flex-col gap-0.5">
						{/* @once */ render(0, RenderMode.MULTIPLE_SQUARE)}
						{/* @once */ render(2, RenderMode.MULTIPLE_SQUARE)}
					</div>

					<div class="flex grow basis-0 flex-col gap-0.5">
						{/* @once */ render(1, RenderMode.MULTIPLE_SQUARE)}
						{/* @once */ render(3, RenderMode.MULTIPLE_SQUARE)}
					</div>
				</div>
			) : length === 3 ? (
				<div class="flex gap-0.5">
					<div class="flex aspect-square grow-2 basis-0 flex-col gap-0.5">
						{/* @once */ render(0, RenderMode.MULTIPLE)}
					</div>

					<div class="flex grow basis-0 flex-col gap-0.5">
						{/* @once */ render(1, RenderMode.MULTIPLE_SQUARE)}
						{/* @once */ render(2, RenderMode.MULTIPLE_SQUARE)}
					</div>
				</div>
			) : length === 2 ? (
				<div class="flex aspect-video gap-0.5">
					<div class="flex grow basis-0 flex-col gap-0.5">{/* @once */ render(0, RenderMode.MULTIPLE)}</div>
					<div class="flex grow basis-0 flex-col gap-0.5">{/* @once */ render(1, RenderMode.MULTIPLE)}</div>
				</div>
			) : length === 1 ? (
				<>{/* @once */ render(0, RenderMode.STANDALONE)}</>
			) : null}
		</div>
	);
};
