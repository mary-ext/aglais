import * as Boxed from '~/components/boxed';
import CircleInfoOutlinedIcon from '~/components/icons-central/circle-info-outline';
import ColorPaletteOutlinedIcon from '~/components/icons-central/color-palette-outline';
import GlobeOutlinedIcon from '~/components/icons-central/globe-outline';
import PersonOutlinedIcon from '~/components/icons-central/person-outline';
import ShieldOutlinedIcon from '~/components/icons-central/shield-outline';
import * as Page from '~/components/page';

const SettingsPage = () => {
	return (
		<>
			<Page.Header>
				<Page.HeaderAccessory>
					<Page.Back to="/" />
				</Page.HeaderAccessory>

				<Page.Heading title="Settings" />
			</Page.Header>

			<Boxed.Container>
				<Boxed.Group>
					<Boxed.GroupHeader>Account settings</Boxed.GroupHeader>

					<Boxed.List>
						<Boxed.LinkItem to="/settings/account" label="My account" icon={PersonOutlinedIcon} />
						<Boxed.LinkItem to="/moderation" label="Moderation" icon={ShieldOutlinedIcon} />
					</Boxed.List>
				</Boxed.Group>

				<Boxed.Group>
					<Boxed.GroupHeader>Application settings</Boxed.GroupHeader>

					<Boxed.List>
						<Boxed.LinkItem to="/settings/content" label="Content" icon={GlobeOutlinedIcon} />
						<Boxed.LinkItem to="/settings/appearance" label="Appearance" icon={ColorPaletteOutlinedIcon} />
						<Boxed.LinkItem to="/settings/about" label="About" icon={CircleInfoOutlinedIcon} />
					</Boxed.List>
				</Boxed.Group>
			</Boxed.Container>
		</>
	);
};

export default SettingsPage;
