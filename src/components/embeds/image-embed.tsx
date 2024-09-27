import type { AppBskyEmbedImages } from '@atcute/client/lexicons';

import { openModal } from '~/globals/modals';

import ImageViewerModalLazy from '~/components/images/image-viewer-modal-lazy';

export interface ImageEmbedProps {
	/** Expected to be static */
	embed: AppBskyEmbedImages.View;
	blur?: boolean;
	/** Expected to be static */
	borderless?: boolean;
	/** Expected to be static */
	standalone?: boolean;
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

const getAspectRatio = (image: AppBskyEmbedImages.ViewImage): number => {
	const dims = image.aspectRatio;

	const width = dims ? dims.width : 1;
	const height = dims ? dims.height : 1;
	const ratio = width / height;

	return ratio;
};

const clampBetween3_4And4_3 = (ratio: number): number => {
	return clamp(ratio, 3 / 4, 4 / 3);
};

const clampBetween3_4And16_9 = (ratio: number): number => {
	return clamp(ratio, 3 / 4, 16 / 9);
};

const AltIndicator = () => {
	return (
		<div class="pointer-events-none absolute bottom-0 right-0 p-2">
			<div class="flex h-4 items-center rounded bg-p-neutral-950/60 px-1 text-[9px] font-bold tracking-wider text-white">
				ALT
			</div>
		</div>
	);
};

const StandaloneRenderer = (props: ImageEmbedProps) => {
	const { embed } = props;

	const images = embed.images;
	const length = images.length;

	const render = (index: number, img: AppBskyEmbedImages.ViewImage) => {
		return (
			<img
				src={/* @once */ img.thumb}
				alt={/* @once */ img.alt}
				class="h-full w-full cursor-pointer object-cover text-[0px]"
				onClick={() => {
					openModal(() => <ImageViewerModalLazy images={images} active={index} />);
				}}
			/>
		);
	};

	if (length === 1) {
		const img = images[0];
		const dims = img.aspectRatio;

		const width = dims ? dims.width : 16;
		const height = dims ? dims.height : 9;
		const ratio = width / height;

		return (
			<div class="max-w-full self-start overflow-hidden rounded-md border border-outline">
				<div class="relative max-h-80 min-h-16 min-w-16 max-w-full" style={{ 'aspect-ratio': ratio }}>
					<img
						src={/* @once */ img.thumb}
						alt={/* @once */ img.alt}
						class="h-full w-full cursor-pointer object-contain text-[0px]"
						onClick={() => {
							openModal(() => <ImageViewerModalLazy images={images} active={0} />);
						}}
					/>

					{/* beautiful hack that ensures we're always using the maximum possible dimension */}
					<div class="h-screen w-screen"></div>

					{/* @once */ img.alt && <AltIndicator />}
				</div>
			</div>
		);
	}

	if (length === 2) {
		const rs = images.map(getAspectRatio);
		const [crA, crB] = rs.map(clampBetween3_4And4_3);

		const totalRatio = crA + crB;

		const nodes = images.map((img, idx) => {
			return (
				<div class="relative overflow-hidden rounded-md border border-outline">
					{/* @once */ render(idx, img)}
					{/* @once */ img.alt && <AltIndicator />}
				</div>
			);
		});

		return (
			<div
				class="grid gap-1.5"
				style={{
					'aspect-ratio': totalRatio,
					'grid-template-columns': `minmax(0, ${Math.floor(crA * 100)}fr) minmax(0, ${Math.floor(crB * 100)}fr)`,
				}}
			>
				{nodes}
			</div>
		);
	}

	if (length >= 3) {
		const rs = images.map(getAspectRatio);
		const crs = rs.map(clampBetween3_4And4_3);

		// 448px - 2px = maximum possible screen width (desktop)
		// 80px = width covered by avatar and padding in timeline item (64px on the left, 16px on the right)
		// 16px = random value to make it clear there's more items to the right
		// 220px = reasonable height limit
		const height = Math.min((1 / crs[0]) * (Math.min(window.innerWidth, 448 - 2) - 80 - 16), 220);
		const widths = crs.map((ratio) => Math.floor(ratio * height));

		const nodes = images.map((img, idx) => {
			const h = `${height}px`;
			const w = `${widths[idx]}px`;
			const r = crs[idx];

			return (
				<div class="shrink-0" style={{ width: w, height: h, 'aspect-ratio': r }}>
					<div class="relative h-full w-full overflow-hidden rounded-md border border-outline">
						{/* @once */ render(idx, img)}
						{/* @once */ img.alt && <AltIndicator />}
					</div>
				</div>
			);
		});

		return (
			<div
				class="-mr-4 flex gap-1.5 overflow-x-auto pr-4 scrollbar-hide"
				style={{
					'margin-left': `calc(var(--embed-left-gutter, 16px) * -1)`,
					'padding-left': `var(--embed-left-gutter, 16px)`,
				}}
			>
				{nodes}
			</div>
		);
	}

	return null;
};

const NonStandaloneRenderer = (props: ImageEmbedProps) => {
	const { embed, borderless } = props;

	const images = embed.images;
	const length = images.length;

	if (length === 1) {
		const img = images[0];

		return (
			<div class={`aspect-video` + (!borderless ? ` overflow-hidden rounded-md border border-outline` : ``)}>
				<img
					src={/* @once */ img.thumb}
					alt={/* @once */ img.alt}
					class="h-full w-full object-contain text-[0px]"
				/>
			</div>
		);
	}

	if (length === 2) {
		const rs = images.map(getAspectRatio);
		const [crA, crB] = rs.map(clampBetween3_4And16_9);

		const totalRatio = crA + crB;

		const nodes = images.map((img) => {
			return (
				<img
					src={/* @once */ img.thumb}
					alt={/* @once */ img.alt}
					class="h-full w-full object-cover text-[0px]"
				/>
			);
		});

		return (
			<div
				class={`grid gap-0.5` + (!borderless ? ` overflow-hidden rounded-md border border-outline` : ``)}
				style={{
					'aspect-ratio': totalRatio,
					'grid-template-columns': `minmax(0, ${Math.floor(crA * 100)}fr) minmax(0, ${Math.floor(crB * 100)}fr)`,
				}}
			>
				{nodes}
			</div>
		);
	}

	if (length === 3) {
		const a = images[0];
		const b = images[1];
		const c = images[2];

		return (
			<div class={'flex gap-0.5' + (!borderless ? ` overflow-hidden rounded-md border border-outline` : ``)}>
				<div class="flex aspect-square grow-2 basis-0 flex-col gap-0.5">
					<img
						src={/* @once */ a.thumb}
						alt={/* @once */ a.alt}
						class="h-full w-full object-cover text-[0px]"
					/>
				</div>

				<div class="flex grow basis-0 flex-col gap-0.5">
					<img
						src={/* @once */ b.thumb}
						alt={/* @once */ b.alt}
						class="h-full w-full object-cover text-[0px]"
					/>
					<img
						src={/* @once */ c.thumb}
						alt={/* @once */ c.alt}
						class="h-full w-full object-cover text-[0px]"
					/>
				</div>
			</div>
		);
	}

	if (length === 4) {
		const rs = images.map(getAspectRatio);
		const [crA, crB, crC, crD] = rs.map(clampBetween3_4And16_9);

		const totalWidth = Math.max(crA, crC) + Math.max(crB, crD);
		const totalHeight = Math.max(1 / crA, 1 / crB) + Math.max(1 / crC, 1 / crD);
		const totalAspectRatio = totalWidth / totalHeight;

		const nodes = images.map((img) => {
			return (
				<img
					src={/* @once */ img.thumb}
					alt={/* @once */ img.alt}
					class="h-full w-full object-cover text-[0px]"
				/>
			);
		});

		return (
			<div
				class={`grid gap-0.5` + (!borderless ? ` overflow-hidden rounded-md border border-outline` : ``)}
				style={{
					'aspect-ratio': totalAspectRatio,
					'grid-template-columns': `minmax(0, ${Math.floor(crA * 100)}fr) minmax(0, ${Math.floor(crB * 100)}fr)`,
					'grid-template-rows': `minmax(0, ${Math.floor(crC * 100)}fr) minmax(0, ${Math.floor(crD * 100)}fr)`,
				}}
			>
				{nodes}
			</div>
		);
	}

	return null;
};
