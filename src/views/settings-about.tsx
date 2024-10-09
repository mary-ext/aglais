import { batch } from 'solid-js';

import { openModal } from '~/globals/modals';

import * as Boxed from '~/components/boxed';
import * as Page from '~/components/page';
import * as Prompt from '~/components/prompt';

const AboutPage = () => {
	return (
		<>
			<Page.Header>
				<Page.HeaderAccessory>
					<Page.Back to="/settings" />
				</Page.HeaderAccessory>

				<Page.Heading title="About" />
			</Page.Header>

			<Boxed.Container>
				<Boxed.Group>
					<Boxed.List>
						<div class="px-4 py-3 text-left text-sm">skeet skeet</div>
					</Boxed.List>
				</Boxed.Group>

				<Boxed.Group>
					<Boxed.GroupHeader>Danger zone</Boxed.GroupHeader>

					<Boxed.List>
						<Boxed.ButtonItem
							label="Reset settings"
							onClick={() => {
								openModal(() => (
									<Prompt.Confirm
										title="Truly reset your settings?"
										description="Any application settings will be reset to default but you won't be logged out. This can't be undone, the app will reload once you've confirmed."
										danger
										onConfirm={() => {
											batch(() => {
												const keys = Object.keys(localStorage);
												for (const key of keys) {
													if (key === 'global' || key.startsWith('account-')) {
														localStorage.removeItem(key);
													}
												}

												location.reload();
											});
										}}
									/>
								));
							}}
						/>
					</Boxed.List>
				</Boxed.Group>
			</Boxed.Container>
		</>
	);
};

export default AboutPage;
