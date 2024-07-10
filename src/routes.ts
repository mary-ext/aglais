import { lazy } from 'solid-js';
import type { RouteDefinition } from './lib/navigation/router';

const DID_OR_HANDLE_RE =
	/^(?:did:[a-z]+:[a-zA-Z0-9._:%-]*[a-zA-Z0-9._-]|[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*(?:\.[a-zA-Z]{2,}))$/;

const TID_RE = /^[234567abcdefghij][234567abcdefghijklmnopqrstuvwxyz]{12}$/;

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
		path: '/',
		component: lazy(() => import('./views/main/home')),
		meta: {
			name: 'Home',
			main: true,
			// public: true,
		},
	},
	{
		path: '/search',
		component: lazy(() => import('./views/main/search')),
		meta: {
			name: 'Search',
			main: true,
			// public: true,
		},
	},
	{
		path: '/notifications',
		component: lazy(() => import('./views/main/notifications')),
		meta: {
			name: 'Notifications',
			main: true,
		},
	},
	{
		path: '/messages',
		component: lazy(() => import('./views/main/messages')),
		meta: {
			name: 'Messages',
			main: true,
		},
	},
	{
		path: '/feeds',
		component: lazy(() => import('./views/main/feeds')),
		meta: {
			name: 'Feeds',
			main: true,
		},
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
		path: '/:didOrHandle',
		component: lazy(() => import('./views/profile')),
		validate(params) {
			return isValidDidOrHandle(params.didOrHandle);
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
		path: '*',
		component: lazy(() => import('./views/not-found')),
		meta: {
			public: true,
		},
	},
];

export default routes;
