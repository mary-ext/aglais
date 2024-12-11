import { useTitle } from '~/lib/navigation/router';
import { useSession } from '~/lib/states/session';

import * as Page from '~/components/page';
import TimelineList from '~/components/timeline/timeline-list';

const LikesPage = () => {
	const { currentAccount } = useSession();

	const did = currentAccount!.did;

	useTitle(() => `My likes — ${import.meta.env.VITE_APP_NAME}`);

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
