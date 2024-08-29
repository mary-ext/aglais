import * as Boxed from '~/components/boxed';
import * as Page from '~/components/page';

const AccountSettingsPage = () => {
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
						<Boxed.ButtonItem label="Handle" blurb={'@' + 'lol'} />
						<Boxed.StaticItem label="Data server" description={'lol'} />
					</Boxed.List>
				</Boxed.Group>

				<Boxed.Group>
					<Boxed.GroupHeader>Account security</Boxed.GroupHeader>

					<Boxed.List>
						<Boxed.LinkItem to="/settings/app-passwords" label="Manage app passwords" />
						<Boxed.ButtonItem label="Change password" />
						<Boxed.StaticItem label="Email two-factor authentication" description={'lol'} />
					</Boxed.List>
				</Boxed.Group>

				<Boxed.Group>
					<Boxed.GroupHeader>Account management</Boxed.GroupHeader>

					<Boxed.List>
						<Boxed.LinkItem to="/settings/export" label="Export my data" />

						<Boxed.ButtonItem label="Deactivate account" variant="danger" />
						<Boxed.ButtonItem label="Delete account" variant="danger" />
					</Boxed.List>
				</Boxed.Group>
			</Boxed.Container>
		</>
	);
};

export default AccountSettingsPage;
