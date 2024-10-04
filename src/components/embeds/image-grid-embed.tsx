import type { AppBskyEmbedImages } from '@atcute/client/lexicons';

export interface ImageGridEmbedProps {
	/** Expected to be static */
	embed: AppBskyEmbedImages.View;
	blur?: boolean;
	/** Expected to be static */
	borderless?: boolean;
}

const enum RenderMode {
	MULTIPLE,
	MULTIPLE_SQUARE,
	STANDALONE,
}

const ImageGridEmbed = (props: ImageGridEmbedProps) => {
	const { embed, borderless } = props;

	const images = embed.images;
	const length = images.length;

	const render = (index: number, mode: RenderMode) => {
		const { alt, thumb } = images[index];

		let cn: string | undefined;

		if (mode === RenderMode.MULTIPLE) {
			cn = `min-h-0 grow basis-0 overflow-hidden`;
		} else if (mode === RenderMode.MULTIPLE_SQUARE) {
			cn = `aspect-square overflow-hidden`;
		} else if (mode === RenderMode.STANDALONE) {
			cn = `aspect-video overflow-hidden`;
		}

		return (
			<div class={`relative bg-background ` + cn}>
				<img
					src={thumb}
					title={alt}
					class={
						`h-full w-full object-contain text-[0px]` +
						// prettier-ignore
						(props.blur ? ` scale-125` + (!borderless ? ` blur` : ` blur-lg`) : ``)
					}
				/>
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

export default ImageGridEmbed;
