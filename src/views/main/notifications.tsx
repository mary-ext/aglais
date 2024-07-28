import { createNotificationCountQuery } from '~/api/queries/notification-count';
import { createNotificationFeedQuery } from '~/api/queries/notification-feed';

import ComposeFAB from '~/components/composer/compose-fab';
import * as Page from '~/components/page';
import PagedList from '~/components/paged-list';
import VirtualItem from '~/components/virtual-item';

import NotificationItem from '~/components/notifications/notification-item';

const NotificationsPage = () => {
	const { feed, reset } = createNotificationFeedQuery();
	const unread = createNotificationCountQuery();

	const isStale = () => {
		const first = feed.data?.pages[0];

		if (first && unread.dataUpdatedAt > first.fetchedAt) {
			return !!unread.data?.count;
		}

		return false;
	};

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
				hasNewData={isStale()}
				hasNextPage={feed.hasNextPage}
				isFetchingNextPage={feed.isFetchingNextPage || feed.isLoading}
				isRefreshing={feed.isRefetching}
				onEndReached={() => feed.fetchNextPage()}
				onRefresh={reset}
				extraBottomGutter
			/>
		</>
	);
};

export default NotificationsPage;
