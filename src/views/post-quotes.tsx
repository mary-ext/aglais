import { createPostQuotesQuery } from '~/api/queries/post-quotes';
import { makeAtUri } from '~/api/utils/strings';

import { useParams } from '~/lib/navigation/router';

import * as Page from '~/components/page';
import PagedList from '~/components/paged-list';
import PostFeedItem from '~/components/timeline/post-feed-item';
import VirtualItem from '~/components/virtual-item';

const PostQuotesPage = () => {
	const { did, rkey } = useParams();

	const uri = makeAtUri(did, 'app.bsky.feed.post', rkey);
	const quotes = createPostQuotesQuery(() => uri);

	return (
		<>
			<Page.Header>
				<Page.HeaderAccessory>
					<Page.Back to={`/${did}/${rkey}`} />
				</Page.HeaderAccessory>

				<Page.Heading title="Quotes" />
			</Page.Header>

			<PagedList
				data={quotes.data?.pages.map((page) => page.posts)}
				error={quotes.error}
				render={(post) => {
					return (
						<VirtualItem estimateHeight={99}>
							<PostFeedItem item={{ post, reply: undefined, reason: undefined, next: false, prev: false }} />
						</VirtualItem>
					);
				}}
				hasNextPage={quotes.hasNextPage}
				isFetchingNextPage={quotes.isFetching}
				onEndReached={() => quotes.fetchNextPage()}
			/>
		</>
	);
};

export default PostQuotesPage;
