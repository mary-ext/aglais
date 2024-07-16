import * as preferences from '~/globals/preferences';

import { useSession } from '~/lib/states/session';

import * as Boxed from '~/components/boxed';
import * as Page from '~/components/page';

const AppearanceSettingsPage = () => {
	const { currentAccount } = useSession();

	const uiPrefs = preferences.global.ui;
	const threadViewPrefs = currentAccount!.preferences.threadView;

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
							value={uiPrefs.theme}
							onChange={(next) => (uiPrefs.theme = next)}
							options={[
								{ value: 'system', label: `System default` },
								{ value: 'light', label: `Light` },
								{ value: 'dark', label: `Dark` },
							]}
						/>
					</Boxed.List>
				</Boxed.Group>

				<Boxed.Group>
					<Boxed.GroupHeader>Thread appearance</Boxed.GroupHeader>

					<Boxed.List>
						<Boxed.SelectItem
							label="Sort replies by"
							value={threadViewPrefs.sort}
							onChange={(next) => (threadViewPrefs.sort = next)}
							options={[
								{ value: 'clout', label: `The Algorithm™` },
								{ value: 'most-likes', label: `Most liked` },
								{ value: 'newest', label: `Newest posted` },
								{ value: 'oldest', label: `Oldest posted` },
							]}
						/>

						<Boxed.ToggleItem
							label="Prioritize replies from people you follow"
							enabled={threadViewPrefs.followsFirst}
							onChange={(next) => (threadViewPrefs.followsFirst = next)}
						/>
					</Boxed.List>

					<Boxed.List>
						<Boxed.ToggleItem
							label="Show post replies in threaded view"
							description="Experimental feature, might change at any time"
							enabled={threadViewPrefs.treeView}
							onChange={(next) => (threadViewPrefs.treeView = next)}
						/>
					</Boxed.List>
				</Boxed.Group>
			</Boxed.Container>
		</>
	);
};

export default AppearanceSettingsPage;
