import * as path from 'node:path';

import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

export default defineConfig({
	build: {
		target: 'esnext',
		minify: 'terser',
		modulePreload: false,
		sourcemap: true,
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
	],
});
