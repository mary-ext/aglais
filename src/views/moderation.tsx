import Avatar from '~/components/avatar';
import AddOutlinedIcon from '~/components/icons-central/add-outline';
import BlockOutlinedIcon from '~/components/icons-central/block-outline';
import ChevronRightOutlinedIcon from '~/components/icons-central/chevron-right-outline';
import EyeSlashOutlinedIcon from '~/components/icons-central/eye-slash-outline';
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

			<div class="flex flex-col gap-6 py-4">
				<div class="flex flex-col gap-2">
					<p class="px-4 text-sm font-medium text-contrast-muted">Account moderation</p>

					<div class="flex flex-col divide-y divide-outline/50 overflow-hidden rounded-lg bg-contrast/5">
						<a
							href="/moderation/lists"
							class="flex justify-between gap-2 px-4 py-3 text-left hover:bg-contrast/sm active:bg-contrast/sm-pressed"
						>
							<div class="flex items-center gap-4">
								<PeopleOutlinedIcon class="text-lg text-contrast-muted" />
								<span class="whitespace-nowrap text-sm font-medium">Moderation lists</span>
							</div>

							<ChevronRightOutlinedIcon class="-mr-1.5 shrink-0 text-xl text-contrast-muted" />
						</a>

						<a
							href="/moderation/muted"
							class="flex justify-between gap-2 px-4 py-3 text-left hover:bg-contrast/sm active:bg-contrast/sm-pressed"
						>
							<div class="flex items-center gap-4">
								<MuteOutlinedIcon class="text-lg text-contrast-muted" />
								<span class="whitespace-nowrap text-sm font-medium">Muted users</span>
							</div>

							<ChevronRightOutlinedIcon class="-mr-1.5 shrink-0 text-xl text-contrast-muted" />
						</a>

						<a
							href="/settings/blocked"
							class="flex justify-between gap-2 px-4 py-3 text-left hover:bg-contrast/sm active:bg-contrast/sm-pressed"
						>
							<div class="flex items-center gap-4">
								<BlockOutlinedIcon class="text-lg text-contrast-muted" />
								<span class="whitespace-nowrap text-sm font-medium">Blocked users</span>
							</div>

							<ChevronRightOutlinedIcon class="-mr-1.5 shrink-0 text-xl text-contrast-muted" />
						</a>
					</div>
				</div>

				<div class="flex flex-col gap-2">
					<p class="px-4 text-sm font-medium text-contrast-muted">Additional moderation tools</p>

					<div class="flex flex-col divide-y divide-outline/50 overflow-hidden rounded-lg bg-contrast/5">
						<a
							href="/moderation/keyword-filters"
							class="flex justify-between gap-2 px-4 py-3 text-left hover:bg-contrast/sm active:bg-contrast/sm-pressed"
						>
							<div class="flex items-center gap-4">
								<FilterOutlinedIcon class="text-lg text-contrast-muted" />
								<span class="whitespace-nowrap text-sm font-medium">Keyword filters</span>
							</div>

							<ChevronRightOutlinedIcon class="-mr-1.5 shrink-0 text-xl text-contrast-muted" />
						</a>

						<a
							href="/moderation/silenced"
							class="flex justify-between gap-2 px-4 py-3 text-left hover:bg-contrast/sm active:bg-contrast/sm-pressed"
						>
							<div class="flex items-center gap-4">
								<EyeSlashOutlinedIcon class="text-lg text-contrast-muted" />
								<span class="whitespace-nowrap text-sm font-medium">Silenced users</span>
							</div>

							<ChevronRightOutlinedIcon class="-mr-1.5 shrink-0 text-xl text-contrast-muted" />
						</a>

						<a
							href="/settings/hidden-reposters"
							class="flex justify-between gap-2 px-4 py-3 text-left hover:bg-contrast/sm active:bg-contrast/sm-pressed"
						>
							<div class="flex items-center gap-4">
								<RepeatOffOutlinedIcon class="text-lg text-contrast-muted" />
								<span class="whitespace-nowrap text-sm font-medium">Hidden reposters</span>
							</div>

							<ChevronRightOutlinedIcon class="-mr-1.5 shrink-0 text-xl text-contrast-muted" />
						</a>
					</div>
				</div>

				<div class="flex flex-col gap-2">
					<p class="px-4 text-sm font-medium text-contrast-muted">Content filters</p>

					<div class="flex flex-col divide-y divide-outline/50 overflow-hidden rounded-lg bg-contrast/5">
						<button class="flex justify-between gap-2 px-4 py-3 text-left hover:bg-contrast/sm active:bg-contrast/sm-pressed">
							<div class="flex min-w-0 flex-col">
								<p class="whitespace-nowrap text-sm font-medium">Adult content</p>
								<p class="min-w-0 break-words text-de text-contrast-muted">
									Erotic nudity or explicit sexual activity
								</p>
							</div>

							<span class="flex min-w-0 gap-1">
								<span class="min-w-0 break-words text-de text-contrast-muted">Warn</span>
								<ChevronRightOutlinedIcon class="-mr-1.5 mt-px shrink-0 rotate-90 text-lg text-contrast-muted" />
							</span>
						</button>

						<button class="flex justify-between gap-2 px-4 py-3 text-left hover:bg-contrast/sm active:bg-contrast/sm-pressed">
							<div class="flex min-w-0 flex-col">
								<p class="whitespace-nowrap text-sm font-medium">Sexually suggestive</p>
								<p class="min-w-0 break-words text-de text-contrast-muted">
									Not pornographic but sexual in nature
								</p>
							</div>

							<span class="flex min-w-0 gap-1">
								<span class="min-w-0 break-words text-de text-contrast-muted">Warn</span>
								<ChevronRightOutlinedIcon class="-mr-1.5 mt-px shrink-0 rotate-90 text-lg text-contrast-muted" />
							</span>
						</button>

						<button class="flex justify-between gap-2 px-4 py-3 text-left hover:bg-contrast/sm active:bg-contrast/sm-pressed">
							<div class="flex min-w-0 flex-col">
								<p class="whitespace-nowrap text-sm font-medium">Graphic media</p>
								<p class="min-w-0 break-words text-de text-contrast-muted">Disturbing content</p>
							</div>

							<span class="flex min-w-0 gap-1">
								<span class="min-w-0 break-words text-de text-contrast-muted">Warn</span>
								<ChevronRightOutlinedIcon class="-mr-1.5 mt-px shrink-0 rotate-90 text-lg text-contrast-muted" />
							</span>
						</button>

						<button class="flex justify-between gap-2 px-4 py-3 text-left hover:bg-contrast/sm active:bg-contrast/sm-pressed">
							<div class="flex min-w-0 flex-col">
								<p class="whitespace-nowrap text-sm font-medium">Nudity</p>
								<p class="min-w-0 break-words text-de text-contrast-muted">Artistic or non-erotic nudity</p>
							</div>

							<span class="flex min-w-0 gap-1">
								<span class="min-w-0 break-words text-de text-contrast-muted">Warn</span>
								<ChevronRightOutlinedIcon class="-mr-1.5 mt-px shrink-0 rotate-90 text-lg text-contrast-muted" />
							</span>
						</button>
					</div>
				</div>

				<div class="flex flex-col gap-2">
					<p class="px-4 text-sm font-medium text-contrast-muted">Label providers</p>

					<div class="flex flex-col divide-y divide-outline/50 overflow-hidden rounded-lg bg-contrast/5">
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
					</div>

					<p class="text-pretty px-4 text-de text-contrast-muted">
						Label providers are entities aiming to provide curated social experiences by annotating the
						content that you see on Bluesky.
					</p>
				</div>
			</div>
		</>
	);
};

export default ModerationPage;
