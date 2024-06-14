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
		},
		fontFamily: {
			sans: `"Roboto", ui-sans-serif, sans-serif, "Noto Color Emoji", "Twemoji Mozilla"`,
			mono: `"JetBrains Mono NL", ui-monospace, monospace`,
		},
		colors: {
			transparent: 'transparent',
			c: {
				white: 'hsl(var(--c-white))',
				black: 'hsl(var(--c-black))',
				contrast: {
					0: 'hsl(var(--c-contrast-0))',
					25: 'hsl(var(--c-contrast-25))',
					50: 'hsl(var(--c-contrast-50))',
					100: 'hsl(var(--c-contrast-100))',
					200: 'hsl(var(--c-contrast-200))',
					300: 'hsl(var(--c-contrast-300))',
					400: 'hsl(var(--c-contrast-400))',
					500: 'hsl(var(--c-contrast-500))',
					600: 'hsl(var(--c-contrast-600))',
					700: 'hsl(var(--c-contrast-700))',
					800: 'hsl(var(--c-contrast-800))',
					900: 'hsl(var(--c-contrast-900))',
					950: 'hsl(var(--c-contrast-950))',
					975: 'hsl(var(--c-contrast-975))',
				},
				primary: {
					25: 'hsl(var(--c-primary-25))',
					50: 'hsl(var(--c-primary-50))',
					100: 'hsl(var(--c-primary-100))',
					200: 'hsl(var(--c-primary-200))',
					300: 'hsl(var(--c-primary-300))',
					400: 'hsl(var(--c-primary-400))',
					500: 'hsl(var(--c-primary-500))',
					600: 'hsl(var(--c-primary-600))',
					700: 'hsl(var(--c-primary-700))',
					800: 'hsl(var(--c-primary-800))',
					900: 'hsl(var(--c-primary-900))',
					950: 'hsl(var(--c-primary-950))',
					975: 'hsl(var(--c-primary-975))',
				},
				positive: {
					25: 'hsl(var(--c-positive-25))',
					50: 'hsl(var(--c-positive-50))',
					100: 'hsl(var(--c-positive-100))',
					200: 'hsl(var(--c-positive-200))',
					300: 'hsl(var(--c-positive-300))',
					400: 'hsl(var(--c-positive-400))',
					500: 'hsl(var(--c-positive-500))',
					600: 'hsl(var(--c-positive-600))',
					700: 'hsl(var(--c-positive-700))',
					800: 'hsl(var(--c-positive-800))',
					900: 'hsl(var(--c-positive-900))',
					950: 'hsl(var(--c-positive-950))',
					975: 'hsl(var(--c-positive-975))',
				},
				negative: {
					25: 'hsl(var(--c-negative-25))',
					50: 'hsl(var(--c-negative-50))',
					100: 'hsl(var(--c-negative-100))',
					200: 'hsl(var(--c-negative-200))',
					300: 'hsl(var(--c-negative-300))',
					400: 'hsl(var(--c-negative-400))',
					500: 'hsl(var(--c-negative-500))',
					600: 'hsl(var(--c-negative-600))',
					700: 'hsl(var(--c-negative-700))',
					800: 'hsl(var(--c-negative-800))',
					900: 'hsl(var(--c-negative-900))',
					950: 'hsl(var(--c-negative-950))',
					975: 'hsl(var(--c-negative-975))',
				},
			},
			t: {
				black: 'hsl(var(--t-black))',
				gray: {
					0: 'hsl(var(--t-gray-0))',
					25: 'hsl(var(--t-gray-25))',
					50: 'hsl(var(--t-gray-50))',
					100: 'hsl(var(--t-gray-100))',
					200: 'hsl(var(--t-gray-200))',
					300: 'hsl(var(--t-gray-300))',
					400: 'hsl(var(--t-gray-400))',
					500: 'hsl(var(--t-gray-500))',
					600: 'hsl(var(--t-gray-600))',
					700: 'hsl(var(--t-gray-700))',
					800: 'hsl(var(--t-gray-800))',
					900: 'hsl(var(--t-gray-900))',
					950: 'hsl(var(--t-gray-950))',
					975: 'hsl(var(--t-gray-975))',
					1000: 'hsl(var(--t-gray-1000))',
				},
				blue: {
					25: 'hsl(var(--t-blue-25))',
					50: 'hsl(var(--t-blue-50))',
					100: 'hsl(var(--t-blue-100))',
					200: 'hsl(var(--t-blue-200))',
					300: 'hsl(var(--t-blue-300))',
					400: 'hsl(var(--t-blue-400))',
					500: 'hsl(var(--t-blue-500))',
					600: 'hsl(var(--t-blue-600))',
					700: 'hsl(var(--t-blue-700))',
					800: 'hsl(var(--t-blue-800))',
					900: 'hsl(var(--t-blue-900))',
					950: 'hsl(var(--t-blue-950))',
					975: 'hsl(var(--t-blue-975))',
					low: 'hsl(var(--t-blue-low))',
				},
				green: {
					25: 'hsl(var(--t-green-25))',
					50: 'hsl(var(--t-green-50))',
					100: 'hsl(var(--t-green-100))',
					200: 'hsl(var(--t-green-200))',
					300: 'hsl(var(--t-green-300))',
					400: 'hsl(var(--t-green-400))',
					500: 'hsl(var(--t-green-500))',
					600: 'hsl(var(--t-green-600))',
					700: 'hsl(var(--t-green-700))',
					800: 'hsl(var(--t-green-800))',
					900: 'hsl(var(--t-green-900))',
					950: 'hsl(var(--t-green-950))',
					975: 'hsl(var(--t-green-975))',
				},
				red: {
					25: 'hsl(var(--t-red-25))',
					50: 'hsl(var(--t-red-50))',
					100: 'hsl(var(--t-red-100))',
					200: 'hsl(var(--t-red-200))',
					300: 'hsl(var(--t-red-300))',
					400: 'hsl(var(--t-red-400))',
					500: 'hsl(var(--t-red-500))',
					600: 'hsl(var(--t-red-600))',
					700: 'hsl(var(--t-red-700))',
					800: 'hsl(var(--t-red-800))',
					900: 'hsl(var(--t-red-900))',
					950: 'hsl(var(--t-red-950))',
					975: 'hsl(var(--t-red-975))',
				},
			},
		},
	},
	corePlugins: {
		outlineStyle: false,
	},
	plugins: [
		plugin(({ addVariant, addUtilities }) => {
			addVariant('modal', '&:modal');
			addVariant('focus-within', '&:has(:focus-visible)');

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
