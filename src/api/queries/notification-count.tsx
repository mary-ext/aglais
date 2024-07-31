import { createQuery } from '@mary/solid-query';

import { useAgent } from '~/lib/states/agent';

export const createNotificationCountQuery = () => {
	const { rpc } = useAgent();

	const query = createQuery(() => ({
		queryKey: ['notification', 'count'],
		async queryFn() {
			const { data } = await rpc.get('app.bsky.notification.getUnreadCount', {
				params: {},
			});

			return data;
		},
		refetchInterval(query) {
			const count = query.state.data?.count;

			if (count !== undefined) {
				if (count >= 30) {
					return 90_000;
				}

				if (count > 0 && Math.random() >= 0.5) {
					return 60_000;
				}
			}

			return 30_000;
		},
		initialData: {
			count: 0,
		},
		staleTime: 30_000,
		refetchOnReconnect: true,
		refetchOnWindowFocus: true,
	}));

	return query;
};
