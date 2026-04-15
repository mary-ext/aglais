import * as path from 'node:path';

import { cloudflare } from '@cloudflare/vite-plugin';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import solid from 'vite-plugin-solid';

const SERVER_HOST = '127.0.0.1';
const SERVER_PORT = 52222;

const OAUTH_SCOPE = 'atproto transition:generic transition:chat.bsky';

export default defineConfig({
	build: {
		target: 'esnext',
		modulePreload: false,
		sourcemap: true,
		assetsInlineLimit: 0,
		rolldownOptions: {
			output: {
				chunkFileNames: 'assets/[hash].js',
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

		// Injects OAuth-related variables for development mode
		{
			name: 'aglais-oauth-inject',
			config(_conf, { command }) {
				if (command === 'build') {
					// Production uses confidential client
					process.env.VITE_OAUTH_CLIENT_ID = '';
					process.env.VITE_OAUTH_REDIRECT_URL = '';
				} else {
					// Development uses public client with http://localhost format
					const redirectUri = `http://${SERVER_HOST}:${SERVER_PORT}/oauth/callback`;

					const clientId =
						`http://localhost` +
						`?redirect_uri=${encodeURIComponent(redirectUri)}` +
						`&scope=${encodeURIComponent(OAUTH_SCOPE)}`;

					process.env.VITE_OAUTH_CLIENT_ID = clientId;
					process.env.VITE_OAUTH_REDIRECT_URL = redirectUri;
				}

				process.env.VITE_OAUTH_SCOPE = OAUTH_SCOPE;
			},
		},
	],
});
