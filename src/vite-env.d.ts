/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/vanillajs" />

/// <reference types="@atcute/bluesky/lexicons" />
/// <reference types="@atcute/bluemoji/lexicons" />

interface ImportMetaEnv {
	readonly VITE_APP_NAME: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

declare module 'hls.js/dist/hls.light.js' {
	export * from 'hls.js';
	export { default } from 'hls.js';
}
