import plugin from 'tailwindcss/plugin';

/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.tsx'],
	theme: {
		extend: {
			fontSize: {
				de: ['0.8125rem', '1.25rem'],
			},
			zIndex: {
				1: '1',
				2: '2',
			},
			spacing: {
				0.75: '0.1875rem',
				7.5: '1.875rem',
				9.5: '2.375rem',
				13: '3.25rem',
				17: '4.24rem',
				22: '5.5rem',
				30: '7.5rem',
				84: '21rem',
				120: '30rem',
			},
			borderWidth: {
				3: '3px',
			},
			minWidth: {
				14: '3.5rem',
				16: '4rem',
			},
			minHeight: {
				16: '4rem',
			},
			maxHeight: {
				141: '35.25rem',
				'50vh': '50vh',
			},
			flexGrow: {
				2: '2',
				4: '4',
			},
			aspectRatio: {
				banner: '3 / 1',
			},
			keyframes: {
				indeterminate: {
					'0%': {
						translate: '-100%',
					},
					'100%': {
						translate: '400%',
					},
				},
			},
			animation: {
				indeterminate: 'indeterminate 1s linear infinite',
			},
			boxShadow: {
				menu: 'rgba(var(--primary) / 0.2) 0px 0px 15px, rgba(var(--primary) / 0.15) 0px 0px 3px 1px',
			},
			dropShadow: {
				DEFAULT: ['0 1px 2px rgb(0 0 0 / .3)', '0 1px 1px rgb(0 0 0 / .1)'],
			},
			opacity: {
				sm: {
					DEFAULT: 0.03,
					pressed: 0.07,
				},
				md: {
					DEFAULT: 0.1,
					pressed: 0.2,
				},
			},
		},
		fontFamily: {
			sans: `"Roboto", ui-sans-serif, sans-serif, "Noto Color Emoji", "Twemoji Mozilla"`,
			mono: `"JetBrains Mono NL", ui-monospace, monospace`,
		},
		colors: {
			transparent: `transparent`,
			white: `#ffffff`,
			black: `#000000`,

			background: `rgb(var(--p-background))`,
			contrast: {
				DEFAULT: `rgb(var(--p-contrast))`,
				muted: `rgb(var(--p-contrast-muted))`,
				overlay: `rgb(var(--p-contrast-overlay))`,
			},
			accent: {
				DEFAULT: `rgb(var(--p-accent))`,
				hover: `rgb(var(--p-accent-hover))`,
				active: `rgb(var(--p-accent-active))`,
				fg: `rgb(var(--p-accent-fg))`,
			},
			repost: `rgb(var(--p-repost))`,
			like: `rgb(var(--p-like))`,
			error: `rgb(var(--p-error))`,
			outline: {
				DEFAULT: `rgb(var(--p-outline))`,
				md: `rgb(var(--p-outline-md))`,
				lg: `rgb(var(--p-outline-lg))`,
			},
		},
	},
	corePlugins: {
		outlineStyle: false,
	},
	future: {
		hoverOnlyWhenSupported: true,
	},
	plugins: [
		plugin(({ addVariant, addUtilities }) => {
			addVariant('modal', '&:modal');
			addVariant('focus-within', '&:has(:focus-visible)');
			// addVariant('hover', '.is-mouse &:hover');
			// addVariant('group-hover', '.is-mouse .group &:hover');

			addUtilities({
				'.scrollbar-hide': {
					'-ms-overflow-style': 'none',
					'scrollbar-width': 'none',

					'&::-webkit-scrollbar': {
						display: 'none',
					},
				},

				'.outline-none': { 'outline-style': 'none' },
				'.outline': { 'outline-style': 'solid' },
				'.outline-dashed': { 'outline-style': 'dashed' },
				'.outline-dotted': { 'outline-style': 'dotted' },
				'.outline-double': { 'outline-style': 'double' },
			});
		}),
	],
};
