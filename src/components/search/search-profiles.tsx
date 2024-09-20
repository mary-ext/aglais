import { createSearchProfilesQuery } from '~/api/queries/search-profiles';

import PagedList from '~/components/paged-list';
import ProfileFollowButton from '~/components/profiles/profile-follow-button';
import ProfileItem from '~/components/profiles/profile-item';
import VirtualItem from '~/components/virtual-item';

export interface SearchProfilesProps {
	q: string;
}

const SearchProfiles = (props: SearchProfilesProps) => {
	const profiles = createSearchProfilesQuery(() => props.q);

	return (
		<PagedList
			data={profiles.data?.pages.map((page) => page.actors)}
			error={profiles.error}
			render={(item) => {
				return (
					<VirtualItem estimateHeight={88}>
						<ProfileItem item={item} AsideComponent={<ProfileFollowButton profile={item} />} />
					</VirtualItem>
				);
			}}
			hasNextPage={profiles.hasNextPage}
			isFetchingNextPage={profiles.isFetching}
			onEndReached={() => profiles.fetchNextPage()}
		/>
	);
};

export default SearchProfiles;
