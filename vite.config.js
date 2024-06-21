import * as path from 'node:path';

import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

export default defineConfig({
	plugins: [solid()],
	build: {
		minify: 'terser',
		modulePreload: false,
		sourcemap: true,
	},
	resolve: {
		alias: {
			'~': path.join(__dirname, './src'),
		},
	},
});
