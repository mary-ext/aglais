import type { SearchTimelineParams } from '~/api/queries/timeline';

import TimelineList from '~/components/timeline/timeline-list';

export interface SearchPostsProps {
	q: string;
	sort: SearchTimelineParams['sort'];
}

const SearchPosts = (props: SearchPostsProps) => {
	return <TimelineList params={{ type: 'search', query: props.q, sort: props.sort }} />;
};

export default SearchPosts;
