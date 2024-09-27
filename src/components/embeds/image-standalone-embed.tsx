import type { AppBskyEmbedImages } from '@atcute/client/lexicons';

import { openModal } from '~/globals/modals';

import ImageViewerModalLazy from '~/components/images/image-viewer-modal-lazy';

import ExpandOutlinedIcon from '../icons-central/expand-outline';

import {
	clampBetween3_4And4_3,
	clampBetween9_16And16_9,
	getAspectRatio,
	isRatioMismatching,
} from './lib/image-utils';

export interface ImageStandaloneEmbedProps {
	/** Expected to be static */
	embed: AppBskyEmbedImages.View;
}

const ImageStandaloneEmbed = ({ embed }: ImageStandaloneEmbedProps) => {
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

					{/* @once */ indicator(!!img.alt, false)}
				</div>
			</div>
		);
	}

	if (length === 2) {
		const rs = images.map(getAspectRatio);
		const [crA, crB] = rs.map(clampBetween3_4And4_3);

		const totalRatio = crA + crB;

		const nodes = images.map((img, idx) => {
			// @todo: this ratio check doesn't always work, espceially since we're
			// not accounting for rendered container width
			const r = rs[idx];
			const cr = !idx ? crA : crB;

			return (
				<div class="relative overflow-hidden rounded-md border border-outline">
					{/* @once */ render(idx, img)}
					{/* @once */ indicator(!!img.alt, isRatioMismatching(r, cr))}
				</div>
			);
		});

		return (
			<div
				class="grid w-full gap-1.5"
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
		const crs = rs.map(clampBetween9_16And16_9);

		// 600px = maximum possible screen width (desktop)
		// 80px = width covered by avatar and padding in timeline item (64px on the left, 16px on the right)
		// 16px = random value to make it clear there's more items to the right
		// 220px = reasonable height limit
		const height = Math.min((1 / crs[0]) * (Math.min(window.innerWidth, 600) - 80 - 16), 220);
		const widths = crs.map((ratio) => Math.floor(ratio * height));

		const nodes = images.map((img, idx) => {
			const h = `${height}px`;
			const w = `${widths[idx]}px`;

			const r = rs[idx];
			const cr = crs[idx];

			return (
				<div class="shrink-0" style={{ width: w, height: h, 'aspect-ratio': cr }}>
					<div class="relative h-full w-full overflow-hidden rounded-md border border-outline">
						{/* @once */ render(idx, img)}
						{/* @once */ indicator(!!img.alt, isRatioMismatching(r, cr))}
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

export default ImageStandaloneEmbed;

const indicator = (alt: boolean, mismatchingRatio: boolean) => {
	if (!alt && !mismatchingRatio) {
		return null;
	}

	return (
		<div class="pointer-events-none absolute bottom-0 right-0 m-2 flex gap-0.5 overflow-hidden rounded">
			{alt && (
				<div class="flex h-4 items-center bg-p-neutral-950/60 px-1 text-[9px] font-bold tracking-wider text-white">
					ALT
				</div>
			)}

			{mismatchingRatio && (
				<div class="flex h-4 items-center bg-p-neutral-950/60 px-1 text-[9px] font-bold tracking-wider text-white">
					<ExpandOutlinedIcon />
				</div>
			)}
		</div>
	);
};
