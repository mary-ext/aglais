import { useTimelineQuery, type TimelineParams } from '~/api/queries/timeline';
import PagedList from '../paged-list';
import VirtualItem from '../virtual-item';
import PostFeedItem from './post-feed-item';

export interface TimelineListProps {
	params: TimelineParams;
}

const TimelineList = (props: TimelineListProps) => {
	const { timeline, isStale, reset } = useTimelineQuery(() => props.params);

	return (
		<PagedList
			data={timeline.data?.pages.map((page) => page.items)}
			error={timeline.error}
			render={(item) => {
				return (
					<VirtualItem estimateHeight={99}>
						<PostFeedItem item={item} />
					</VirtualItem>
				);
			}}
			hasNewData={isStale()}
			hasNextPage={timeline.hasNextPage}
			isFetchingNextPage={timeline.isFetchingNextPage || timeline.isLoading}
			isRefreshing={timeline.isRefetching}
			onEndReached={() => timeline.fetchNextPage()}
			onRefresh={reset}
			extraBottomGutter
		/>
	);
};

export default TimelineList;
