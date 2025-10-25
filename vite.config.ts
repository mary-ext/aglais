import * as path from 'node:path';

import { cloudflare } from '@cloudflare/vite-plugin';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import solid from 'vite-plugin-solid';

export default defineConfig({
	build: {
		target: 'esnext',
		modulePreload: false,
		sourcemap: true,
		assetsInlineLimit: 0,
		minify: 'terser',
		rollupOptions: {
			output: {
				chunkFileNames: 'assets/[hash].js',
				manualChunks: {
					common: [
						'solid-js',
						'solid-js/store',
						'solid-js/web',

						'@atcute/client',
						'@atcute/oauth-browser-client',
						'@mary/events',
						'@mary/solid-query',

						'src/service-worker.tsx',

						'src/globals/events.ts',
						'src/globals/locales.ts',
						'src/globals/modals.tsx',
						'src/globals/navigation.ts',
						'src/globals/preferences.ts',

						'src/lib/states/agent.tsx',
						'src/lib/states/session.tsx',
						'src/lib/states/theme.tsx',
					],
					shell: ['src/shell.tsx'],
				},
			},
		},
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
	server: {
		allowedHosts: ['.trycloudflare.com'],
	},
	optimizeDeps: {
		esbuildOptions: {
			target: 'esnext',
		},
	},
	plugins: [
		solid({
			babel: {
				plugins: [['babel-plugin-transform-typescript-const-enums']],
			},
		}),

		cloudflare(),

		VitePWA({
			registerType: 'prompt',
			injectRegister: null,
			workbox: {
				globPatterns: ['**/*.{js,css,html,svg,jpg,png}'],
				cleanupOutdatedCaches: true,
			},
			manifest: {
				id: '/',
				start_url: '/',
				scope: '/',
				name: 'Aglais',
				short_name: 'Aglais',
				description: 'Alternative web client for Bluesky',
				display: 'standalone',
				background_color: '#000000',
				icons: [
					{
						src: 'favicon.png',
						type: 'image/png',
						sizes: '150x150',
					},
				],
			},
		}),

		// Transform the icon components to remove the `() => _tmpl$()` wrapper
		{
			name: 'aglais-icon-transform',
			transform(code, id) {
				if (!id.includes('/icons-central/')) {
					return;
				}

				const transformed = code.replace(
					/(?<=createIcon\()\(\)\s*=>*.([\w$]+)\(\)(?=\))/g,
					(_match, id) => id,
				);

				return { code: transformed, map: null };
			},
		},
	],
});
