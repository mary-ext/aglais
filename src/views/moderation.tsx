import { GLOBAL_LABELS, getLocalizedLabel } from '~/api/moderation';
import { FlagsHidden, PreferenceHide, PreferenceIgnore, PreferenceWarn } from '~/api/moderation/constants';

import { Key } from '~/lib/keyed';
import { useTitle } from '~/lib/navigation/router';
import { useSession } from '~/lib/states/session';
import { inject } from '~/lib/states/singleton';
import ModerationService from '~/lib/states/singletons/moderation';

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
	const { currentAccount } = useSession();

	const hydratedOptions = inject(ModerationService);

	const moderation = currentAccount!.preferences.moderation;

	useTitle(() => `Moderation — ${import.meta.env.VITE_APP_NAME}`);

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
						{Object.entries(GLOBAL_LABELS).map(([label, def]) => {
							if (def.f & FlagsHidden) {
								return;
							}

							const locale = getLocalizedLabel(def);

							return (
								<Boxed.SelectItem
									label={/* @once */ locale.n}
									description={/* @once */ locale.d}
									value={moderation.labels[label] ?? def.d}
									onChange={(next) => {
										moderation.labels[label] = next;
									}}
									options={[
										{ value: PreferenceIgnore, label: `Off` },
										{ value: PreferenceWarn, label: `Warn` },
										{ value: PreferenceHide, label: `Hide` },
									]}
								/>
							);
						})}
					</Boxed.List>
				</Boxed.Group>

				<Boxed.Group>
					<Boxed.GroupHeader>Label providers</Boxed.GroupHeader>

					<Boxed.List>
						<Key each={Object.values(hydratedOptions().labelerDefinitions)} by={(x) => x.did}>
							{(labeler) => {
								const did = labeler().did;
								const profile = () => labeler().profile;

								return (
									<a
										href={`/${did}/labels`}
										class="flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-contrast/sm active:bg-contrast/sm-pressed"
									>
										<Avatar type="labeler" src={profile().avatar} size="in" />

										<div class="min-w-0 grow">
											<p class="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium empty:hidden">
												{profile().displayName}
											</p>
											<p class="overflow-hidden text-ellipsis whitespace-nowrap text-de text-contrast-muted">
												{'@' + profile().handle.toLowerCase()}
											</p>
										</div>

										<ChevronRightOutlinedIcon class="-mr-1.5 shrink-0 text-xl text-contrast-muted" />
									</a>
								);
							}}
						</Key>

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
