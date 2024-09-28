import * as path from 'node:path';

import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import solid from 'vite-plugin-solid';

import metadata from './public/oauth/client-metadata.json';

const SERVER_HOST = '127.0.0.1';
const SERVER_PORT = 52222;

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
		host: SERVER_HOST,
		port: SERVER_PORT,
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

		// Injects OAuth-related variables
		{
			config(_conf, { command }) {
				if (command === 'build') {
					process.env.VITE_OAUTH_CLIENT_ID = metadata.client_id;
					process.env.VITE_OAUTH_REDIRECT_URL = metadata.redirect_uris[0];
				} else {
					const redirectUri = `http://${SERVER_HOST}:${SERVER_PORT}/oauth/callback`;
					const clientId = `http://localhost?redirect_uri=${encodeURIComponent(redirectUri)}`;

					process.env.VITE_DEV_SERVER_PORT = '' + SERVER_PORT;
					process.env.VITE_OAUTH_CLIENT_ID = clientId;
					process.env.VITE_OAUTH_REDIRECT_URL = redirectUri;
				}

				process.env.VITE_CLIENT_URI = metadata.client_uri;
				process.env.VITE_OAUTH_SCOPE = metadata.scope;
			},
		},
	],
});
