import { useSession } from '~/lib/states/session';

import * as Page from '~/components/page';
import TimelineList from '~/components/feeds/timeline-list';

const LikesPage = () => {
	const { currentAccount } = useSession();

	const did = currentAccount!.did;

	return (
		<>
			<Page.Header>
				<Page.HeaderAccessory>
					<Page.Back to="/" />
				</Page.HeaderAccessory>

				<Page.Heading title="Likes" />
			</Page.Header>

			<TimelineList
				params={{
					type: 'profile',
					actor: did,
					tab: 'likes',
				}}
			/>
		</>
	);
};

export default LikesPage;
