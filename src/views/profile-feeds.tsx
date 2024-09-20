import { createMemo } from 'solid-js';

import type { AppBskyFeedDefs } from '@atcute/client/lexicons';
import { useQueryClient } from '@mary/solid-query';

import { moderateGeneric } from '~/api/moderation/entities/generic';
import { precacheFeed } from '~/api/queries-cache/feed-precache';
import { createProfileQuery } from '~/api/queries/profile';
import { createProfileFeedsQuery } from '~/api/queries/profile-feeds';
import { parseAtUri } from '~/api/utils/strings';

import { history } from '~/globals/navigation';

import { isElementAltClicked, isElementClicked } from '~/lib/interaction';
import { formatLong } from '~/lib/intl/number';
import { useParams } from '~/lib/navigation/router';
import { useModerationOptions } from '~/lib/states/moderation';

import Avatar from '~/components/avatar';
import * as Page from '~/components/page';
import PagedList from '~/components/paged-list';
import VirtualItem from '~/components/virtual-item';

const ProfileFeedsPage = () => {
	const { did } = useParams();

	const feeds = createProfileFeedsQuery(() => did);
	const profile = createProfileQuery(() => did);

	return (
		<>
			<Page.Header>
				<Page.HeaderAccessory>
					<Page.Back to={`/${did}`} />
				</Page.HeaderAccessory>

				<Page.Heading
					title="Feeds"
					subtitle={(() => {
						const subject = profile.data;
						if (subject) {
							return '@' + subject.handle;
						}
					})()}
				/>
			</Page.Header>

			<PagedList
				data={feeds.data?.pages.map((page) => page.feeds)}
				error={feeds.error}
				render={(item) => {
					return (
						<VirtualItem estimateHeight={125}>
							<FeedItem item={item} />
						</VirtualItem>
					);
				}}
				hasNextPage={feeds.hasNextPage}
				isFetchingNextPage={feeds.isFetching}
				onEndReached={() => feeds.fetchNextPage()}
			/>
		</>
	);
};

export default ProfileFeedsPage;

interface FeedItemProps {
	/** Expected to be static */
	item: AppBskyFeedDefs.GeneratorView;
}

const FeedItem = ({ item }: FeedItemProps) => {
	const queryClient = useQueryClient();
	const moderationOptions = useModerationOptions();

	const creator = item.creator;
	const href = `/${creator.did}/feeds/${parseAtUri(item.uri).rkey}`;

	const moderation = createMemo(() => moderateGeneric(item, creator.did, moderationOptions()));

	const handleClick = (ev: MouseEvent | KeyboardEvent) => {
		if (!isElementClicked(ev)) {
			return;
		}

		ev.preventDefault();
		precacheFeed(queryClient, item);

		if (isElementAltClicked(ev)) {
			window.open(href, '_blank');
		} else {
			history.navigate(href);
		}
	};

	return (
		<div
			tabindex={0}
			onClick={handleClick}
			onAuxClick={handleClick}
			onKeyDown={handleClick}
			class="flex cursor-pointer flex-col px-4 py-3 hover:bg-contrast/sm active:bg-contrast/sm-pressed"
		>
			<div class="mb-3 flex items-center gap-3">
				<Avatar
					type="feed"
					src={item.avatar}
					href={href}
					moderation={moderation()}
					onClick={() => precacheFeed(queryClient, item)}
					size="lg"
				/>

				<a href={href} onClick={() => precacheFeed(queryClient, item)} class="min-w-0 grow">
					<p class="break-words text-sm font-bold">{item.displayName}</p>
					<p class="overflow-hidden text-ellipsis whitespace-nowrap text-de text-contrast-muted">{
						/* @once */ `Feed by @${creator.handle}`
					}</p>
				</a>
			</div>

			<p class="mb-2 line-clamp-5 whitespace-pre-wrap break-words text-de empty:hidden">
				{/* @once */ item.description}
			</p>

			<p class="text-de text-contrast-muted">
				{/* @once */ `Liked by ${formatLong(item.likeCount ?? 0)} users`}
			</p>
		</div>
	);
};
