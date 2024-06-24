import * as Page from '~/components/page';

import ComposeFAB from '~/components/composer/compose-fab';

const NotificationsPage = () => {
	return (
		<>
			<Page.Header>
				<Page.HeaderAccessory>
					<Page.MainMenu />
				</Page.HeaderAccessory>

				<Page.Heading title="Notifications" />
			</Page.Header>

			<ComposeFAB />
		</>
	);
};

export default NotificationsPage;
