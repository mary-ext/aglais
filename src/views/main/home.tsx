import { useTimelineQuery } from '~/api/queries/timeline';
import FAB from '~/components/fab';
import PostFeedItem from '~/components/feeds/post-feed-item';

import IconButton from '~/components/icon-button';
import ChevronRightOutlinedIcon from '~/components/icons-central/chevron-right-outline';
import GearOutlinedIcon from '~/components/icons-central/gear-outline';
import WriteOutlinedIcon from '~/components/icons-central/write-outline';
import * as Page from '~/components/page';
import PagedList from '~/components/paged-list';
import VirtualItem from '~/components/virtual-item';

const HomePage = () => {
	const { timeline, isStale, reset } = useTimelineQuery(() => {
		return {
			type: 'following',
			showQuotes: true,
			showReplies: 'follows',
			showReposts: true,
		};
	});

	return (
		<>
			<Page.Header>
				<Page.HeaderAccessory>
					<Page.MainMenu />
				</Page.HeaderAccessory>

				<div class="flex min-w-0 grow">
					<button class="-mx-2 flex items-center gap-1 overflow-hidden rounded px-2 py-1 hover:bg-contrast-hinted/md active:bg-contrast-hinted/md-pressed">
						<span class="overflow-hidden text-ellipsis whitespace-nowrap text-base font-bold">
							{'Following'}
						</span>
						<ChevronRightOutlinedIcon class="-mr-1 shrink-0 rotate-90 text-lg text-contrast-muted" />
					</button>
				</div>

				<Page.HeaderAccessory>
					<IconButton title="Home settings" icon={GearOutlinedIcon} />
				</Page.HeaderAccessory>
			</Page.Header>

			<FAB icon={WriteOutlinedIcon} label="New post" />

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
			/>
		</>
	);
};

export default HomePage;
