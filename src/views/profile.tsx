import { Match, Show, Switch, createMemo } from 'solid-js';

import type { AppBskyActorDefs } from '@atcute/bluesky';
import { ClientResponseError } from '@atcute/client';
import type { ActorIdentifier } from '@atcute/lexicons';
import { useQueryClient } from '@mary/solid-query';

import { useProfileShadow } from '~/api/cache/profile-shadow';
import { createProfileQuery } from '~/api/queries/profile';
import { isDid } from '~/api/types/identity';

import { openModal } from '~/globals/modals';
import { history } from '~/globals/navigation';

import { asStringUnion, useSearchParams } from '~/lib/hooks/search-params';
import { formatCompact } from '~/lib/intl/number';
import { useParams, useTitle } from '~/lib/navigation/router';
import { truncateMiddle } from '~/lib/utils/strings';

import CircularProgressView from '~/components/circular-progress-view';
import Divider from '~/components/divider';
import ErrorView from '~/components/error-view';
import FilterBar from '~/components/filter-bar';
import IconButton from '~/components/icon-button';
import MagnifyingGlassOutlinedIcon from '~/components/icons-central/magnifying-glass-outline';
import MoreHorizOutlinedIcon from '~/components/icons-central/more-horiz-outline';
import ShieldOutlinedIcon from '~/components/icons-central/shield-outline';
import * as Page from '~/components/page';
import ProfileOverflowMenu from '~/components/profiles/profile-overflow-menu';
import ProfileViewHeader from '~/components/profiles/profile-view-header';
import TimelineList from '~/components/timeline/timeline-list';
import VirtualItem from '~/components/virtual-item';

const ProfilePage = () => {
	const { didOrHandle } = useParams<{
		didOrHandle: ActorIdentifier;
	}>();

	const queryClient = useQueryClient();
	const profile = createProfileQuery(() => didOrHandle);

	useTitle(() => {
		const data = profile.data;
		if (data) {
			const displayName = data.displayName?.trim();
			const handle = data.handle.toLowerCase();

			const subtitle = displayName ? `${displayName} (@${handle})` : `@${handle}`;

			return `${subtitle} — ${import.meta.env.VITE_APP_NAME}`;
		}

		return `Profile — ${import.meta.env.VITE_APP_NAME}`;
	});

	return (
		<>
			<Page.Header>
				<Page.HeaderAccessory>
					<Page.Back to="/" />
				</Page.HeaderAccessory>

				<Switch>
					<Match when={profile.data}>
						{(data) => (
							<>
								<Page.Heading
									title={data().displayName}
									subtitle={(() => {
										if (!profile.isPlaceholderData) {
											return `${formatCompact(data().postsCount ?? 0)} posts`;
										}
									})()}
								/>

								<Page.HeaderAccessory>
									<Show when={data().associated?.labeler}>
										<IconButton
											icon={ShieldOutlinedIcon}
											title="Labeling"
											disabled={profile.isPlaceholderData}
											onClick={() => {
												history.navigate(`/${data().did}/labels`);
											}}
										/>
									</Show>

									<IconButton
										icon={MagnifyingGlassOutlinedIcon}
										title="Search"
										disabled={profile.isPlaceholderData}
										onClick={() => {
											history.navigate(`/${data().did}/search`);
										}}
									/>

									<IconButton
										icon={MoreHorizOutlinedIcon}
										title="Actions"
										disabled={profile.isPlaceholderData}
										onClick={(ev) => {
											const anchor = ev.currentTarget;
											openModal(() => <ProfileOverflowMenu anchor={anchor} profile={data()} />);
										}}
									/>
								</Page.HeaderAccessory>
							</>
						)}
					</Match>

					<Match when>
						<Page.Heading title="Profile" />
					</Match>
				</Switch>
			</Page.Header>

			<Switch>
				<Match when={profile.error} keyed>
					{(err) => {
						if (
							err instanceof ClientResponseError &&
							(err.error === 'InvalidRequest' ||
								err.error === 'AccountTakedown' ||
								err.error === 'AccountDeactivated')
						) {
							const text =
								err.error === 'AccountTakedown'
									? `This account is taken down`
									: err.error === 'AccountDeactivated'
										? `This account has deactivated`
										: `This account doesn't exist`;

							return (
								<div class="contents">
									<div class="aspect-banner bg-outline-md"></div>
									<div class="flex flex-col gap-3 p-4">
										<div class="-mt-11 h-20 w-20 shrink-0 overflow-hidden rounded-full bg-outline-md outline-2 outline-background outline"></div>
										<p dir="auto" class="overflow-hidden break-words text-xl font-bold text-contrast-muted">
											{didOrHandle}
										</p>
									</div>

									<div class="mx-auto my-8 w-full max-w-80 p-4">
										<p class="text-xl font-bold">{text}</p>
										<p class="mt-2 text-sm text-contrast-muted">Try searching for another.</p>
									</div>
								</div>
							);
						}

						return <ErrorView error={err} onRetry={() => profile.refetch()} />;
					}}
				</Match>

				<Match
					when={(() => {
						if (!isDid(didOrHandle)) {
							return profile.data;
						}
					})()}
					keyed
				>
					{(data) => {
						queryClient.setQueryData(['profile', data.did], data);
						history.navigate(`/${data.did}`, { replace: true });
						return null;
					}}
				</Match>

				<Match when={profile.data}>
					{(data) => <ProfileView data={data()} isPlaceholderData={profile.isPlaceholderData} />}
				</Match>

				<Match when>
					<CircularProgressView />
				</Match>
			</Switch>
		</>
	);
};

export default ProfilePage;

type ProfileData = AppBskyActorDefs.ProfileViewDetailed;

const ProfileView = (props: { data: ProfileData; isPlaceholderData?: boolean }) => {
	const [params, setParams] = useSearchParams({
		tab: asStringUnion(['posts', 'replies', 'media']).withDefault('posts'),
	});

	const data = () => props.data;
	const did = data().did;

	const shadow = useProfileShadow(data);

	return (
		<>
			<VirtualItem>
				<ProfileViewHeader {...props} />
			</VirtualItem>

			{props.isPlaceholderData && <CircularProgressView />}

			<div hidden={props.isPlaceholderData}>
				<Switch>
					<Match when={props.data.viewer?.blockedBy}>
						{(_blockedBy) => {
							const handle = createMemo(() => truncateMiddle(data().handle, 29));

							return (
								<div class="mx-auto my-8 w-full max-w-80 p-4">
									<p class="text-xl font-bold">{`@${handle()} blocked you`}</p>
									<p class="mt-2 text-sm text-contrast-muted">{`You are blocked from following @${handle()} and viewing @${handle()}'s posts.`}</p>
								</div>
							);
						}}
					</Match>

					<Match when={shadow().blockUri}>
						{(_blockedBy) => {
							const handle = createMemo(() => truncateMiddle(data().handle, 29));

							return (
								<div class="mx-auto my-8 w-full max-w-80 p-4">
									<p class="text-xl font-bold">{`@${handle()} is blocked`}</p>
									<p class="mt-2 text-sm text-contrast-muted">{`You can no longer view @${handle()}'s posts.`}</p>
								</div>
							);
						}}
					</Match>

					<Match when>
						<Divider />

						<FilterBar
							value={params.tab}
							onChange={(next) => setParams({ tab: next })}
							options={[
								{
									value: 'posts',
									label: `Posts`,
								},
								{
									value: 'replies',
									label: `Posts and replies`,
								},
								{
									value: 'media',
									label: `Media`,
								},
							]}
						/>

						<TimelineList
							timelineDid={did}
							params={{
								type: 'profile',
								actor: did,
								tab: params.tab,
							}}
						/>
					</Match>
				</Switch>
			</div>
		</>
	);
};
