import * as path from 'node:path';

import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

export default defineConfig({
	build: {
		target: 'esnext',
		modulePreload: false,
		sourcemap: true,
		assetsInlineLimit: 0,
		minify: 'terser',
		terserOptions: {
			compress: {
				passes: 3,
			},
		},
	},
	resolve: {
		alias: {
			'~': path.join(__dirname, './src'),
		},
	},
	plugins: [
		solid({
			babel: {
				plugins: [['babel-plugin-transform-typescript-const-enums']],
			},
		}),
		// Transform the icon components to remove the `() => _tmpl$()` wrapper
		{
			transform(code, id) {
				if (!id.includes('/icons-central/')) {
					return;
				}

				const transformed = code.replace(
					/(?<=createIcon\()\(\)\s*=>*.([\w$]+)\(\)(?=\))/g,
					(match, id) => id,
				);

				return { code: transformed, map: null };
			},
		},
	],
});
