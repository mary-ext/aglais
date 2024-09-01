import * as path from 'node:path';

import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

import metadata from './public/oauth/client-metadata.json' with { type: 'json' };

const SERVER_HOST = '127.0.0.1';
const SERVER_PORT = 52222;

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

		oauthMetadataPlugin(),
	],
});

/**
 * @returns {import('vite').Plugin}
 */
function oauthMetadataPlugin() {
	return {
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
	};
}
