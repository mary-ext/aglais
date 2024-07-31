import { createSignal } from 'solid-js';

import { createNotificationCountQuery } from '~/api/queries/notification-count';
import { createNotificationFeedQuery } from '~/api/queries/notification-feed';

import { onRouteEnter } from '~/lib/navigation/router';

import ComposeFAB from '~/components/composer/compose-fab';
import * as Page from '~/components/page';
import PagedList from '~/components/paged-list';
import VirtualItem from '~/components/virtual-item';

import NotificationItem from '~/components/notifications/notification-item';

const NotificationsPage = () => {
	const { feed, reset, firstFetchedAt } = createNotificationFeedQuery();
	const unread = createNotificationCountQuery();

	// We want to differentiate a refetch done by the user and one that's done
	// by us from the route enter callback.
	const [isRefetching, setIsRefetching] = createSignal(false);

	const isStale = () => {
		if (unread.dataUpdatedAt > firstFetchedAt()) {
			return unread.data.count > 0;
		}

		return false;
	};

	const refetch = async () => {
		try {
			setIsRefetching(true);
			await reset();
		} finally {
			setIsRefetching(false);
		}
	};

	onRouteEnter(() => {
		// If the user is still roughly at the top, refetch notifications directly
		if (window.scrollY <= 53 * 2 && !feed.isFetching) {
			reset();
		}
	});

	return (
		<>
			<Page.Header>
				<Page.HeaderAccessory>
					<Page.MainMenu />
				</Page.HeaderAccessory>

				<Page.Heading title="Notifications" />
			</Page.Header>

			<ComposeFAB />

			<PagedList
				data={feed.data?.pages.map((page) => page.slices)}
				error={feed.error}
				render={(item) => {
					return (
						<VirtualItem estimateHeight={113}>
							<NotificationItem item={item} />
						</VirtualItem>
					);
				}}
				hasNewData={isStale() && !feed.isRefetching}
				hasNextPage={feed.hasNextPage}
				isFetchingNextPage={feed.isFetchingNextPage || feed.isLoading}
				// Only show refreshing if:
				// - User is explicitly refreshing
				// - We're doing an automatic refresh with an unread count
				isRefreshing={isRefetching() || (feed.isRefetching && unread.data.count > 0)}
				onEndReached={() => feed.fetchNextPage()}
				onRefresh={refetch}
				extraBottomGutter
			/>
		</>
	);
};

export default NotificationsPage;
