import ChevronRightOutlinedIcon from '~/components/icons-central/chevron-right-outline';
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

			<div class="flex flex-col gap-6 py-4">
				<div class="flex flex-col gap-2">
					<p class="px-4 text-sm font-medium text-contrast-muted">Account settings</p>

					<div class="flex flex-col divide-y divide-outline/50 overflow-hidden rounded-lg bg-contrast/5">
						<a
							href="/settings/account"
							class="flex justify-between gap-2 px-4 py-3 text-left hover:bg-contrast/sm active:bg-contrast/sm-pressed"
						>
							<div class="flex items-center gap-4">
								<PersonOutlinedIcon class="text-lg text-contrast-muted" />
								<span class="whitespace-nowrap text-sm font-medium">My account</span>
							</div>

							<ChevronRightOutlinedIcon class="-mr-1.5 shrink-0 text-xl text-contrast-muted" />
						</a>

						<a
							href="/moderation"
							class="flex justify-between gap-2 px-4 py-3 text-left hover:bg-contrast/sm active:bg-contrast/sm-pressed"
						>
							<div class="flex items-center gap-4">
								<ShieldOutlinedIcon class="text-lg text-contrast-muted" />
								<span class="whitespace-nowrap text-sm font-medium">Moderation</span>
							</div>

							<ChevronRightOutlinedIcon class="-mr-1.5 shrink-0 text-xl text-contrast-muted" />
						</a>

						<a
							href="/settings/content"
							class="flex justify-between gap-2 px-4 py-3 text-left hover:bg-contrast/sm active:bg-contrast/sm-pressed"
						>
							<div class="flex items-center gap-4">
								<GlobeOutlinedIcon class="text-lg text-contrast-muted" />
								<span class="whitespace-nowrap text-sm font-medium">Content</span>
							</div>

							<ChevronRightOutlinedIcon class="-mr-1.5 shrink-0 text-xl text-contrast-muted" />
						</a>
					</div>
				</div>

				<div class="flex flex-col gap-2">
					<p class="px-4 text-sm font-medium text-contrast-muted">Application settings</p>

					<div class="flex flex-col divide-y divide-outline/50 overflow-hidden rounded-lg bg-contrast/5">
						<a
							href="/settings/appearance"
							class="flex justify-between gap-2 px-4 py-3 text-left hover:bg-contrast/sm active:bg-contrast/sm-pressed"
						>
							<div class="flex items-center gap-4">
								<ColorPaletteOutlinedIcon class="text-lg text-contrast-muted" />
								<span class="whitespace-nowrap text-sm font-medium">Appearance</span>
							</div>

							<ChevronRightOutlinedIcon class="-mr-1.5 shrink-0 text-xl text-contrast-muted" />
						</a>

						<a
							href="/settings/about"
							class="flex justify-between gap-2 px-4 py-3 text-left hover:bg-contrast/sm active:bg-contrast/sm-pressed"
						>
							<div class="flex items-center gap-4">
								<CircleInfoOutlinedIcon class="text-lg text-contrast-muted" />
								<span class="whitespace-nowrap text-sm font-medium">About</span>
							</div>

							<ChevronRightOutlinedIcon class="-mr-1.5 shrink-0 text-xl text-contrast-muted" />
						</a>
					</div>
				</div>
			</div>
		</>
	);
};

export default SettingsPage;
