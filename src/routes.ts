import { lazy } from 'solid-js';
import type { RouteDefinition } from './lib/navigation/router';

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
		path: '*',
		component: lazy(() => import('./views/not-found')),
		meta: {
			public: true,
		},
	},
];

export default routes;
