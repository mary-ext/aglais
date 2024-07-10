import * as Page from '~/components/page';

const ProfilePage = () => {
	return (
		<>
			<Page.Header>
				<Page.HeaderAccessory>
					<Page.Back to="/" />
				</Page.HeaderAccessory>

				<Page.Heading title="Profile" />
			</Page.Header>
		</>
	);
};

export default ProfilePage;
