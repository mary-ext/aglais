import { lazy } from 'solid-js';

import type { RouteDefinition } from './lib/navigation/router';

const DID_RE = /^did:[a-z]+:[a-zA-Z0-9._:%-]*[a-zA-Z0-9._-]$/;
const DID_OR_HANDLE_RE =
	/^(?:did:[a-z]+:[a-zA-Z0-9._:%-]*[a-zA-Z0-9._-]|[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*(?:\.[a-zA-Z]{2,}))$/;

const TID_RE = /^[234567abcdefghij][234567abcdefghijklmnopqrstuvwxyz]{12}$/;

const isValidDid = (str: string | undefined): boolean => {
	return str !== undefined && DID_RE.test(str);
};
const isValidDidOrHandle = (str: string | undefined): boolean => {
	return str !== undefined && DID_OR_HANDLE_RE.test(str);
};
const isValidTid = (str: string | undefined): boolean => {
	return str !== undefined && str.length === 13 && TID_RE.test(str);
};
const isValidBookmarkTagId = (str: string | undefined) => {
	return str === 'all' || isValidTid(str);
};

const routes: RouteDefinition[] = [
	{
		path: '/oauth/callback',
		component: lazy(() => import('./views/oauth-callback')),
		meta: {
			public: true,
		},
	},

	{
		path: '/',
		component: lazy(() => import('./views/main/home')),
		single: true,
		meta: {
			name: 'Home',
			main: true,
			// public: true,
		},
	},
	{
		path: '/explore',
		component: lazy(() => import('./views/main/explore')),
		single: true,
		meta: {
			name: 'Explore',
			main: true,
			// public: true,
		},
	},
	{
		path: '/notifications',
		component: lazy(() => import('./views/main/notifications')),
		single: true,
		meta: {
			name: 'Notifications',
			main: true,
		},
	},
	{
		path: '/messages',
		component: lazy(() => import('./views/main/messages')),
		single: true,
		meta: {
			name: 'Messages',
			main: true,
		},
	},
	{
		path: '/feeds',
		component: lazy(() => import('./views/main/feeds')),
		single: true,
		meta: {
			name: 'Feeds',
			main: true,
		},
	},

	{
		path: '/moderation',
		component: lazy(() => import('./views/moderation')),
	},

	{
		path: '/settings',
		component: lazy(() => import('./views/settings')),
	},
	{
		path: '/settings/account',
		component: lazy(() => import('./views/settings-account')),
	},
	{
		path: '/settings/app-passwords',
		component: lazy(() => import('./views/settings-app-passwords')),
	},
	{
		path: '/settings/appearance',
		component: lazy(() => import('./views/settings-appearance')),
	},
	{
		path: '/settings/content',
		component: lazy(() => import('./views/settings-content')),
	},

	{
		path: '/bookmarks',
		component: lazy(() => import('./views/bookmarks')),
	},
	{
		path: '/bookmarks/:tagId',
		component: lazy(() => import('./views/bookmarks-listing')),
		validate(params) {
			return isValidBookmarkTagId(params.tagId);
		},
	},

	{
		path: '/search',
		component: lazy(() => import('./views/search')),
	},

	{
		path: '/likes',
		component: lazy(() => import('./views/likes')),
	},

	{
		path: '/bluemoji/emotes',
		component: lazy(() => import('./views/bluemoji-emotes')),
	},

	{
		path: '/:didOrHandle',
		component: lazy(() => import('./views/profile')),
		validate(params) {
			return isValidDidOrHandle(params.didOrHandle);
		},
	},

	{
		path: '/:did/following',
		component: lazy(() => import('./views/profile-following')),
		validate(params) {
			return isValidDid(params.did);
		},
	},
	{
		path: '/:did/followers',
		component: lazy(() => import('./views/profile-followers')),
		validate(params) {
			return isValidDid(params.did);
		},
	},
	{
		path: '/:did/known-followers',
		component: lazy(() => import('./views/profile-known-followers')),
		validate(params) {
			return isValidDid(params.did);
		},
	},

	{
		path: '/:did/labels',
		component: lazy(() => import('./views/profile-labels')),
		validate(params) {
			return isValidDid(params.did);
		},
	},

	{
		path: '/:did/feeds',
		component: lazy(() => import('./views/profile-feeds')),
		validate(params) {
			return isValidDid(params.did);
		},
	},
	{
		path: '/:didOrHandle/feeds/:rkey',
		component: lazy(() => import('./views/profile-feed')),
		validate(params) {
			return isValidDidOrHandle(params.didOrHandle);
		},
	},
	{
		path: '/:did/feeds/:rkey/info',
		component: lazy(() => import('./views/profile-feed-info')),
		validate(params) {
			return isValidDidOrHandle(params.did);
		},
	},

	{
		path: '/:didOrHandle/:rkey',
		component: lazy(() => import('./views/post-thread')),
		validate(params) {
			return isValidDidOrHandle(params.didOrHandle) && isValidTid(params.rkey);
		},
	},
	{
		path: '/:did/:rkey/likes',
		component: lazy(() => import('./views/post-likes')),
		validate(params) {
			return isValidDid(params.did) && isValidTid(params.rkey);
		},
	},
	{
		path: '/:did/:rkey/reposts',
		component: lazy(() => import('./views/post-reposts')),
		validate(params) {
			return isValidDid(params.did) && isValidTid(params.rkey);
		},
	},
	{
		path: '/:did/:rkey/quotes',
		component: lazy(() => import('./views/post-quotes')),
		validate(params) {
			return isValidDid(params.did) && isValidTid(params.rkey);
		},
	},

	{
		path: '*',
		component: lazy(() => import('./views/not-found')),
		meta: {
			public: true,
		},
	},
];

export default routes;
