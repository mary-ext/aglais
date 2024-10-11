import { createQuery } from '@mary/solid-query';

import { dequal } from '~/api/utils/dequal';

import { useAgent } from '~/lib/states/agent';
import { useSession } from '~/lib/states/session';

export interface NotificationCountResponse {
	count: number;
	unread: boolean;
}

export const createNotificationCountQuery = (options?: { readonly disabled?: boolean }) => {
	const { currentAccount } = useSession();
	const { rpc } = useAgent();

	const query = createQuery(() => ({
		queryKey: ['notification', 'count'],
		enabled: currentAccount !== undefined && !options?.disabled,
		async queryFn(): Promise<NotificationCountResponse> {
			const { data } = await rpc.get('app.bsky.notification.getUnreadCount', {
				params: {},
			});

			return {
				count: data.count,
				unread: false,
			};
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
		structuralSharing(_prev: any, _next: any): any {
			const prev = _prev as NotificationCountResponse | undefined;
			const next = _next as NotificationCountResponse;

			if (!prev) {
				return next;
			}

			const shared: NotificationCountResponse = {
				count: next.count,
				unread: prev.unread || next.count > 0,
			};

			return dequal(prev, shared) ? prev : shared;
		},
		initialData: {
			count: 0,
			unread: false,
		} satisfies NotificationCountResponse,
		initialDataUpdatedAt: 0,
		staleTime: 30_000,
		refetchOnReconnect: true,
		refetchOnWindowFocus: true,
	}));

	return query;
};
