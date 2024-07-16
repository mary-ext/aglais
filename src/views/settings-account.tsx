import { safeUrlParse } from '~/api/utils/strings';

import { useSession } from '~/lib/states/session';

import * as Boxed from '~/components/boxed';
import * as Page from '~/components/page';

const AccountSettingsPage = () => {
	const { currentAccount } = useSession();

	const session = currentAccount!.data.session;
	const isLimited = currentAccount!.data.scope !== undefined;

	return (
		<>
			<Page.Header>
				<Page.HeaderAccessory>
					<Page.Back to="/" />
				</Page.HeaderAccessory>

				<Page.Heading title="My account" />
			</Page.Header>

			<Boxed.Container>
				<Boxed.Group>
					<Boxed.GroupHeader>Account information</Boxed.GroupHeader>

					<Boxed.List>
						<Boxed.ButtonItem label="Handle" blurb={'@' + session.handle} />
						<Boxed.StaticItem
							label="Data server"
							description={formatDataServer(currentAccount!.data.service)}
						/>
					</Boxed.List>
				</Boxed.Group>

				{!isLimited && (
					<Boxed.Group>
						<Boxed.GroupHeader>Account security</Boxed.GroupHeader>

						<Boxed.List>
							<Boxed.LinkItem to="/settings/app-passwords" label="Manage app passwords" />
							<Boxed.ButtonItem label="Change password" />
							<Boxed.StaticItem
								label="Email two-factor authentication"
								description={session.emailAuthFactor ? `Enabled` : `Disabled`}
							/>
						</Boxed.List>
					</Boxed.Group>
				)}

				<Boxed.Group>
					<Boxed.GroupHeader>Account management</Boxed.GroupHeader>

					<Boxed.List>
						<Boxed.LinkItem to="/settings/export" label="Export my data" />

						{!isLimited && (
							<>
								<Boxed.ButtonItem label="Deactivate account" variant="danger" />
								<Boxed.ButtonItem label="Delete account" variant="danger" />
							</>
						)}
					</Boxed.List>
				</Boxed.Group>
			</Boxed.Container>
		</>
	);
};

export default AccountSettingsPage;

const formatDataServer = (uri: string): string => {
	const url = safeUrlParse(uri);
	if (url === null) {
		return `N/A`;
	}

	const host = url.host;
	if (host.endsWith('.host.bsky.network')) {
		return 'bsky.social';
	}

	return host;
};
