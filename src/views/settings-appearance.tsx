import * as Boxed from '~/components/boxed';
import * as Page from '~/components/page';

const AppearanceSettingsPage = () => {
	return (
		<>
			<Page.Header>
				<Page.HeaderAccessory>
					<Page.Back to="/settings" />
				</Page.HeaderAccessory>

				<Page.Heading title="Appearance" />
			</Page.Header>

			<Boxed.Container>
				<Boxed.Group>
					<Boxed.List>
						<Boxed.SelectItem
							label="Application theme"
							value={'system'}
							onChange={(next) => {
								//
							}}
							options={[
								{
									value: 'system',
									label: `System default`,
								},
								{
									value: 'light',
									label: `Light`,
								},
								{
									value: 'dark',
									label: `Dark`,
								},
							]}
						/>
					</Boxed.List>

					<Boxed.List>
						<Boxed.ToggleItem
							label="Show post replies in threaded view"
							description="This is an experimental feature"
							enabled={true}
							onChange={(next) => {
								//
							}}
						/>
					</Boxed.List>
				</Boxed.Group>
			</Boxed.Container>
		</>
	);
};

export default AppearanceSettingsPage;
