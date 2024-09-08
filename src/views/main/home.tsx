import ComposeFAB from '~/components/composer/compose-fab';
import IconButton from '~/components/icon-button';
import ChevronRightOutlinedIcon from '~/components/icons-central/chevron-right-outline';
import GearOutlinedIcon from '~/components/icons-central/gear-outline';
import * as Page from '~/components/page';
import TimelineList from '~/components/timeline/timeline-list';

const HomePage = () => {
	return (
		<>
			<Page.Header>
				<Page.HeaderAccessory>
					<Page.MainMenu />
				</Page.HeaderAccessory>

				<div class="flex min-w-0 grow">
					<button class="-mx-2 flex items-center gap-1 overflow-hidden rounded px-2 py-1 hover:bg-contrast-hinted/md active:bg-contrast-hinted/md-pressed">
						<span class="overflow-hidden text-ellipsis whitespace-nowrap text-base font-bold">
							{'Following'}
						</span>
						<ChevronRightOutlinedIcon class="-mr-1 shrink-0 rotate-90 text-lg text-contrast-muted" />
					</button>
				</div>

				<Page.HeaderAccessory>
					<IconButton title="Home settings" icon={GearOutlinedIcon} />
				</Page.HeaderAccessory>
			</Page.Header>

			<ComposeFAB />

			<TimelineList
				params={{
					type: 'following',
					showQuotes: true,
					showReplies: 'follows',
					showReposts: true,
				}}
			/>
		</>
	);
};

export default HomePage;
