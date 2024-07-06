import type { Component, ComponentProps } from 'solid-js';

import AmericanFootballSolidIcon from '../icons-central/american-football-solid';
import AudioSolidIcon from '../icons-central/audio-solid';
import BasketSolidIcon from '../icons-central/basket-solid';
import BookmarkSolidIcon from '../icons-central/bookmark-solid';
import BrushSolidIcon from '../icons-central/brush-solid';
import DirectionalPadSolidIcon from '../icons-central/directional-pad-solid';
import GraduationCapSolidIcon from '../icons-central/graduation-cap-solid';

export const BOOKMARK_ICONS: Record<string, Component<ComponentProps<'svg'>>> = {
	art: BrushSolidIcon,
	education: GraduationCapSolidIcon,
	gaming: DirectionalPadSolidIcon,
	music: AudioSolidIcon,
	shopping: BasketSolidIcon,
	sports: AmericanFootballSolidIcon,
};

export const BOOKMARK_COLORS: string[] = ['#ffd400', '#f91880', '#7856ff', '#ff7a00', '#00ba7c'];

export interface BookmarkFolderAvatarProps {
	icon?: string;
	color?: string;
}

const BookmarkFolderAvatar = (props: BookmarkFolderAvatarProps) => {
	return (
		<div
			style={(() => {
				const bgColor = props.color;
				const rgb = bgColor && hexStringToRgb(bgColor);

				if (rgb) {
					const whiteContrast = contrastRatioAPCA(rgb, [255, 255, 255]);
					const blackContrast = contrastRatioAPCA(rgb, [0, 0, 0]);
					const textColor = whiteContrast >= blackContrast ? '#fff' : '#000';

					return { 'background-color': bgColor, color: textColor };
				}
			})()}
			class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-base text-accent-fg"
		>
			{(() => {
				const kind = props.icon;
				let Icon: Component<ComponentProps<'svg'>> = BookmarkSolidIcon;

				if (kind !== undefined && kind in BOOKMARK_ICONS) {
					Icon = BOOKMARK_ICONS[kind];
				}

				return <Icon />;
			})()}
		</div>
	);
};

export default BookmarkFolderAvatar;

type RgbArray = [red: number, green: number, blue: number];

const hexStringToRgb = (str: string): RgbArray | null => {
	str = str.toLowerCase();

	if (/^#[0-9a-f]{6}$/.test(str)) {
		const red = parseInt(str.slice(1, 3), 16);
		const green = parseInt(str.slice(3, 5), 16);
		const blue = parseInt(str.slice(5, 7), 16);

		return [red, green, blue];
	}

	return null;
};

// https://github.com/ChromeDevTools/devtools-frontend/blob/28b11d7de94f583ba15df697a0ebb05440c3451f/front_end/core/common/ColorUtils.ts#L103-L160
const mainTRC = 2.4;
const normBgExp = 0.56;
const normFgExp = 0.57;
const revBgExp = 0.65;
const revFgExp = 0.62;
const blkThrs = 0.022;
const blkClmp = 1.414;
const scaleBoW = 1.14;
const scaleWoB = 1.14;
const loConOffset = 0.027;
const loClip = 0.1;
const deltaLuminanceMin = 0.0005;

const luminanceAPCA = ([rSRGB, gSRGB, bSRGB]: RgbArray): number => {
	const r = Math.pow(rSRGB, mainTRC);
	const g = Math.pow(gSRGB, mainTRC);
	const b = Math.pow(bSRGB, mainTRC);

	return 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
};

const contrastRatioAPCA = (fgRGB: RgbArray, bgRGB: RgbArray): number => {
	return contrastRatioByLuminanceAPCA(luminanceAPCA(fgRGB), luminanceAPCA(bgRGB));
};

const clampLuminance = (value: number): number => {
	return value > blkThrs ? value : value + Math.pow(blkThrs - value, blkClmp);
};

const contrastRatioByLuminanceAPCA = (fgLuminance: number, bgLuminance: number): number => {
	fgLuminance = clampLuminance(fgLuminance);
	bgLuminance = clampLuminance(bgLuminance);
	if (Math.abs(fgLuminance - bgLuminance) < deltaLuminanceMin) {
		return 0;
	}
	let result = 0;
	if (bgLuminance > fgLuminance) {
		// Black text on white.
		result = (Math.pow(bgLuminance, normBgExp) - Math.pow(fgLuminance, normFgExp)) * scaleBoW;
		result = result < loClip ? 0 : result - loConOffset;
	} else {
		// White text on black.
		result = (Math.pow(bgLuminance, revBgExp) - Math.pow(fgLuminance, revFgExp)) * scaleWoB;
		result = result > -loClip ? 0 : result + loConOffset;
	}
	return result * 100;
};
