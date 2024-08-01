import Avatar from '~/components/avatar';
import * as Boxed from '~/components/boxed';
import AddOutlinedIcon from '~/components/icons-central/add-outline';
import BlockOutlinedIcon from '~/components/icons-central/block-outline';
import ChevronRightOutlinedIcon from '~/components/icons-central/chevron-right-outline';
import FilterOutlinedIcon from '~/components/icons-central/filter-outline';
import MuteOutlinedIcon from '~/components/icons-central/mute-outline';
import PeopleOutlinedIcon from '~/components/icons-central/people-outline';
import RepeatOffOutlinedIcon from '~/components/icons-central/repeat-off-outline';
import * as Page from '~/components/page';

const ModerationPage = () => {
	return (
		<>
			<Page.Header>
				<Page.HeaderAccessory>
					<Page.Back to="/" />
				</Page.HeaderAccessory>

				<Page.Heading title="Moderation" />
			</Page.Header>

			<Boxed.Container>
				<Boxed.Group>
					<Boxed.GroupHeader>Account moderation</Boxed.GroupHeader>

					<Boxed.List>
						<Boxed.LinkItem to="/moderation/lists" label="Moderation lists" icon={PeopleOutlinedIcon} />
						<Boxed.LinkItem to="/moderation/muted" label="Muted users" icon={MuteOutlinedIcon} />
						<Boxed.LinkItem to="/moderation/blocked" label="Blocked users" icon={BlockOutlinedIcon} />
					</Boxed.List>
				</Boxed.Group>

				<Boxed.Group>
					<Boxed.GroupHeader>Additional moderation tools</Boxed.GroupHeader>

					<Boxed.List>
						<Boxed.LinkItem
							to="/moderation/keyword-filters"
							label="Keyword filters"
							icon={FilterOutlinedIcon}
						/>
						<Boxed.LinkItem
							to="/moderation/hidden-reposters"
							label="Hidden reposters"
							icon={RepeatOffOutlinedIcon}
						/>
					</Boxed.List>
				</Boxed.Group>

				<Boxed.Group>
					<Boxed.GroupHeader>Content filters</Boxed.GroupHeader>

					<Boxed.List>
						<Boxed.SelectItem
							label="Adult content"
							description="Erotic nudity or explicit sexual activity"
							value={'warn'}
							onChange={(next) => {
								//
							}}
							options={[
								{ value: 'off', label: 'Warn' },
								{ value: 'warn', label: 'Warn' },
								{ value: 'hide', label: 'Hide' },
							]}
						/>

						<Boxed.SelectItem
							label="Sexually suggestive"
							description="Not pornographic but sexual in nature"
							value={'warn'}
							onChange={(next) => {
								//
							}}
							options={[
								{ value: 'off', label: 'Warn' },
								{ value: 'warn', label: 'Warn' },
								{ value: 'hide', label: 'Hide' },
							]}
						/>

						<Boxed.SelectItem
							label="Graphic media"
							description="Disturbing content"
							value={'warn'}
							onChange={(next) => {
								//
							}}
							options={[
								{ value: 'off', label: 'Warn' },
								{ value: 'warn', label: 'Warn' },
								{ value: 'hide', label: 'Hide' },
							]}
						/>

						<Boxed.SelectItem
							label="Nudity"
							description="Artistic or non-erotic nudity"
							value={'warn'}
							onChange={(next) => {
								//
							}}
							options={[
								{ value: 'off', label: 'Warn' },
								{ value: 'warn', label: 'Warn' },
								{ value: 'hide', label: 'Hide' },
							]}
						/>
					</Boxed.List>
				</Boxed.Group>

				<Boxed.Group>
					<Boxed.GroupHeader>Label providers</Boxed.GroupHeader>

					<Boxed.List>
						<a class="flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-contrast/sm active:bg-contrast/sm-pressed">
							<Avatar type="labeler" size="in" />

							<div class="min-w-0 grow">
								<p class="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium empty:hidden">
									Bluesky Moderation Service
								</p>
								<p class="overflow-hidden text-ellipsis whitespace-nowrap text-de text-contrast-muted">
									@moderation.bsky.app
								</p>
							</div>

							<ChevronRightOutlinedIcon class="-mr-1.5 shrink-0 text-xl text-contrast-muted" />
						</a>

						<a
							href="/moderation/providers/add"
							class="flex justify-between gap-2 px-4 py-3 text-left hover:bg-contrast/sm active:bg-contrast/sm-pressed"
						>
							<div class="flex items-center gap-4">
								<AddOutlinedIcon class="w-9 text-lg text-contrast-muted" />
								<span class="whitespace-nowrap text-sm font-medium">Explore new providers</span>
							</div>
						</a>
					</Boxed.List>

					<Boxed.GroupBlurb>
						Label providers are entities aiming to provide curated social experiences by annotating the
						content that you see on Bluesky.
					</Boxed.GroupBlurb>
				</Boxed.Group>
			</Boxed.Container>
		</>
	);
};

export default ModerationPage;
