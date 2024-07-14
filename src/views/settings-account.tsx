import { useSession } from '~/lib/states/session';

import ChevronRightOutlinedIcon from '~/components/icons-central/chevron-right-outline';
import * as Page from '~/components/page';
import { safeUrlParse } from '~/api/utils/strings';

const AccountSettingsPage = () => {
	const { currentAccount } = useSession();
	const session = currentAccount!.data.session;

	const isLimited = currentAccount!.data.scope !== undefined;

	return (
		<>
			<Page.Header>
				<Page.HeaderAccessory>
					<Page.Back to="/" />
				</Page.HeaderAccessory>

				<Page.Heading title="My account" />
			</Page.Header>

			<div class="flex flex-col gap-6 py-4">
				<div class="flex flex-col gap-2">
					<p class="px-4 text-sm font-medium text-contrast-muted">Account information</p>

					<div class="flex flex-col divide-y divide-outline/50 overflow-hidden rounded-lg bg-contrast/5">
						<button class="flex justify-between gap-2 px-4 py-3 text-left hover:bg-contrast/sm active:bg-contrast/sm-pressed">
							<span class="whitespace-nowrap text-sm font-medium">Handle</span>

							<span class="flex min-w-0 gap-2">
								<span class="min-w-0 break-words text-de text-contrast-muted">{'@' + session.handle}</span>
								<ChevronRightOutlinedIcon class="-mr-1.5 shrink-0 text-xl text-contrast-muted" />
							</span>
						</button>
						<div class="flex justify-between gap-4 px-4 py-3 text-left">
							<div class="flex min-w-0 flex-col">
								<p class="whitespace-nowrap text-sm font-medium">Data server</p>
								<p class="min-w-0 break-words text-de text-contrast-muted">
									{/* @once */ formatDataServer(currentAccount!.data.service)}
								</p>
							</div>
						</div>
					</div>
				</div>

				<div hidden={isLimited} class="flex flex-col gap-2">
					<p class="px-4 text-sm font-medium text-contrast-muted">Account security</p>

					<div class="flex flex-col divide-y divide-outline/50 overflow-hidden rounded-lg bg-contrast/5">
						<a
							href="/settings/app-passwords"
							class="flex justify-between gap-2 px-4 py-3 text-left hover:bg-contrast/sm active:bg-contrast/sm-pressed"
						>
							<span class="whitespace-nowrap text-sm font-medium">Manage app passwords</span>
							<ChevronRightOutlinedIcon class="-mr-1.5 shrink-0 text-xl text-contrast-muted" />
						</a>

						<button class="flex justify-between gap-2 px-4 py-3 text-left hover:bg-contrast/sm active:bg-contrast/sm-pressed">
							<span class="whitespace-nowrap text-sm font-medium">Change password</span>
							<ChevronRightOutlinedIcon class="-mr-1.5 shrink-0 text-xl text-contrast-muted" />
						</button>

						<div class="flex justify-between gap-2 px-4 py-3 text-left">
							<div class="flex min-w-0 flex-col">
								<p class="whitespace-nowrap text-sm font-medium">Email two-factor authentication</p>
								<p class="min-w-0 break-words text-de text-contrast-muted">Enabled</p>
							</div>
						</div>
					</div>
				</div>

				<div hidden={isLimited} class="flex flex-col gap-2">
					<p class="px-4 text-sm font-medium text-contrast-muted">Account management</p>

					<div class="flex flex-col divide-y divide-outline/50 overflow-hidden rounded-lg bg-contrast/5">
						<a
							href="/settings/export"
							class="flex justify-between gap-2 px-4 py-3 text-left hover:bg-contrast/sm active:bg-contrast/sm-pressed"
						>
							<span class="whitespace-nowrap text-sm font-medium">Export my data</span>
							<ChevronRightOutlinedIcon class="-mr-1.5 shrink-0 text-xl text-contrast-muted" />
						</a>

						<button class="flex justify-between gap-2 px-4 py-3 text-left hover:bg-contrast/sm active:bg-contrast/sm-pressed">
							<span class="text-sm font-medium text-error">Deactivate account</span>
						</button>

						<button class="flex justify-between gap-2 px-4 py-3 text-left hover:bg-contrast/sm active:bg-contrast/sm-pressed">
							<span class="text-sm font-medium text-error">Delete account</span>
						</button>
					</div>
				</div>
			</div>
		</>
	);
};

export default AccountSettingsPage;

const formatDataServer = (uri: string): string => {
	const url = safeUrlParse(uri);
	if (url === null) {
		return `N/A`;
	}

	const host = url.host;
	if (host.endsWith('.host.bsky.network')) {
		return 'bsky.social';
	}

	return host;
};
