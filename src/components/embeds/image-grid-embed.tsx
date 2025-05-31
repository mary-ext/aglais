import type { AppBskyEmbedImages } from '@atcute/bluesky';

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

	const render = (index: number) => {
		const image = images[index];

		return (
			<img
				loading="lazy"
				src={/* @once */ image.thumb}
				alt={/* @once */ image.alt}
				class={
					`absolute inset-0 h-full w-full bg-background text-[0px]` +
					(length === 1 ? ` object-contain` : ` object-cover`) +
					(props.blur ? ` scale-125 ${borderless ? `blur-xl` : `blur`}` : ``)
				}
			/>
		);
	};

	return (
		<div>
			{length === 4 ? (
				<div class="flex gap-0.5">
					<div class="flex shrink-0 grow flex-col gap-0.5">
						<div
							class={
								`relative aspect-[1.5] shrink-0 grow overflow-hidden` +
								(!borderless ? ` rounded-tl-md border border-outline` : ``)
							}
						>
							{/* @once */ render(0)}
						</div>
						<div
							class={
								`relative aspect-[1.5] shrink-0 grow overflow-hidden` +
								(!borderless ? ` rounded-bl-md border border-outline` : ``)
							}
						>
							{/* @once */ render(2)}
						</div>
					</div>
					<div class="flex shrink-0 grow flex-col gap-0.5">
						<div
							class={
								`relative aspect-[1.5] shrink-0 grow overflow-hidden` +
								(!borderless ? ` rounded-tr-md border border-outline` : ``)
							}
						>
							{/* @once */ render(1)}
						</div>
						<div
							class={
								`relative aspect-[1.5] shrink-0 grow overflow-hidden` +
								(!borderless ? ` rounded-br-md border border-outline` : ``)
							}
						>
							{/* @once */ render(3)}
						</div>
					</div>
				</div>
			) : length === 3 ? (
				<div class="flex gap-0.5">
					<div class="flex aspect-square shrink-0 grow flex-col gap-0.5">
						<div
							class={
								`relative flex-shrink-0 flex-grow overflow-hidden` +
								(!borderless ? ` rounded-bl-md rounded-tl-md border border-outline` : ``)
							}
						>
							{/* @once */ render(0)}
						</div>
					</div>
					<div class="flex aspect-square shrink-0 grow flex-col gap-0.5">
						<div
							class={
								`relative flex-shrink-0 flex-grow overflow-hidden` +
								(!borderless ? ` rounded-tr-md border border-outline` : ``)
							}
						>
							{/* @once */ render(1)}
						</div>
						<div
							class={
								`relative flex-shrink-0 flex-grow overflow-hidden` +
								(!borderless ? ` rounded-br-md border border-outline` : ``)
							}
						>
							{/* @once */ render(2)}
						</div>
					</div>
				</div>
			) : length === 2 ? (
				<div class="flex gap-0.5">
					<div class="flex flex-1 flex-col gap-0.5">
						<div
							class={
								`relative aspect-square flex-shrink-0 flex-grow overflow-hidden` +
								(!borderless ? ` rounded-bl-md rounded-tl-md border border-outline` : ``)
							}
						>
							{/* @once */ render(0)}
						</div>
					</div>
					<div class="flex flex-1 flex-col gap-0.5">
						<div
							class={
								`relative aspect-square flex-shrink-0 flex-grow overflow-hidden` +
								(!borderless ? ` rounded-br-md rounded-tr-md border border-outline` : ``)
							}
						>
							{/* @once */ render(1)}
						</div>
					</div>
				</div>
			) : length === 1 ? (
				<div
					class={
						`relative aspect-video overflow-hidden` + (!borderless ? ` rounded-md border border-outline` : ``)
					}
				>
					{/* @once */ render(0)}
				</div>
			) : null}
		</div>
	);
};

export default ImageGridEmbed;
