import type { AppBskyEmbedImages } from '@atcute/client/lexicons';

import { clampBetween3_4And16_9, getAspectRatio } from './lib/image-utils';

export interface ImageGridEmbedProps {
	/** Expected to be static */
	embed: AppBskyEmbedImages.View;
	blur?: boolean;
	/** Expected to be static */
	borderless?: boolean;
}

const ImageGridEmbed = (props: ImageGridEmbedProps) => {
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

export default ImageGridEmbed;
