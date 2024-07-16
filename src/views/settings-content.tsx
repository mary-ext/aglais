import * as Boxed from '~/components/boxed';
import * as Page from '~/components/page';

const ContentSettingsPage = () => {
	return (
		<>
			<Page.Header>
				<Page.HeaderAccessory>
					<Page.Back to="/settings" />
				</Page.HeaderAccessory>

				<Page.Heading title="Content" />
			</Page.Header>

			<Boxed.Container>
				<Boxed.Group>
					<Boxed.GroupHeader>Content you post</Boxed.GroupHeader>

					<Boxed.List>
						<Boxed.SelectItem
							label="Post language"
							value={'system'}
							onChange={(next) => {
								//
							}}
							options={[
								{
									value: 'system',
									label: 'System default (English)',
								},
							]}
						/>

						<Boxed.SelectItem
							label="Who can reply to my posts"
							value={'everyone'}
							onChange={(next) => {
								//
							}}
							options={[
								{
									value: 'everyone',
									label: `Everyone`,
								},
								{
									value: 'mentioned',
									label: `Mentioned users`,
								},
								{
									value: 'followed',
									label: `Followed users`,
								},
							]}
						/>
					</Boxed.List>

					<Boxed.GroupBlurb>Altering these settings will not affect existing posts</Boxed.GroupBlurb>
				</Boxed.Group>

				<Boxed.Group>
					<Boxed.GroupHeader>Content translations</Boxed.GroupHeader>

					<Boxed.List>
						<Boxed.ToggleItem
							label="Use Google Translate"
							enabled={false}
							onChange={(next) => {
								//
							}}
						/>

						<Boxed.SelectItem
							label="Translate into"
							value={'system'}
							onChange={(next) => {
								//
							}}
							options={[
								{
									value: 'system',
									label: `System default (English)`,
								},
							]}
						/>

						<Boxed.ButtonItem
							label="Exclude languages from translation"
							description="0 languages excluded"
							onClick={() => {
								//
							}}
						/>
					</Boxed.List>

					<Boxed.List>
						<Boxed.ToggleItem
							label="Proxy translation requests"
							description="Send translations through a proxy service and not directly from device. Availability might be limited"
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

export default ContentSettingsPage;
