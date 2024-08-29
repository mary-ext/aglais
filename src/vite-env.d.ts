/// <reference types="vite/client" />
/// <reference types="@atcute/bluesky/lexicons" />
/// <reference types="@atcute/bluemoji/lexicons" />

interface ImportMetaEnv {
	readonly VITE_DEV_SERVER_PORT: string;
	readonly VITE_OAUTH_CLIENT_ID: string;
	readonly VITE_OAUTH_REDIRECT_URL: string;
	readonly VITE_OAUTH_SCOPE: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
