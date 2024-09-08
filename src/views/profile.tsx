import { createSignal, Match, Show, Switch } from 'solid-js';

import { XRPCError } from '@atcute/client';
import type { AppBskyActorDefs } from '@atcute/client/lexicons';
import { useQueryClient } from '@mary/solid-query';

import { useProfileShadow } from '~/api/cache/profile-shadow';
import { createProfileQuery } from '~/api/queries/profile';
import { isDid } from '~/api/utils/strings';

import { openModal } from '~/globals/modals';
import { history } from '~/globals/navigation';

import { formatCompact } from '~/lib/intl/number';
import { useParams } from '~/lib/navigation/router';

import CircularProgressView from '~/components/circular-progress-view';
import Divider from '~/components/divider';
import ErrorView from '~/components/error-view';
import FilterBar from '~/components/filter-bar';
import IconButton from '~/components/icon-button';
import MoreHorizOutlinedIcon from '~/components/icons-central/more-horiz-outline';
import ShieldOutlinedIcon from '~/components/icons-central/shield-outline';
import * as Page from '~/components/page';
import VirtualItem from '~/components/virtual-item';

import ProfileOverflowMenu from '~/components/profiles/profile-overflow-menu';
import ProfileViewHeader from '~/components/profiles/profile-view-header';
import TimelineList from '~/components/timeline/timeline-list';

const ProfilePage = () => {
	const { didOrHandle } = useParams();

	const queryClient = useQueryClient();
	const profile = createProfileQuery(() => didOrHandle);

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
							err instanceof XRPCError &&
							(err.kind === 'InvalidRequest' ||
								err.kind === 'AccountTakedown' ||
								err.kind === 'AccountDeactivated')
						) {
							const text =
								err.kind === 'AccountTakedown'
									? `This account is taken down`
									: err.kind === 'AccountDeactivated'
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

const enum PostFilter {
	POSTS = 'posts',
	POSTS_WITH_REPLIES = 'replies',
	MEDIA = 'media',
}

const ProfileView = (props: { data: ProfileData; isPlaceholderData?: boolean }) => {
	const [filter, setFilter] = createSignal(PostFilter.POSTS);

	const shadow = useProfileShadow(() => props.data);
	const did = props.data.did;

	return (
		<>
			<VirtualItem>
				<ProfileViewHeader {...props} />
			</VirtualItem>

			{props.isPlaceholderData && <CircularProgressView />}

			<div hidden={props.isPlaceholderData}>
				<Switch>
					<Match when={props.data.viewer?.blockedBy}>
						<div class="mx-auto my-8 w-full max-w-80 p-4">
							<p class="text-xl font-bold">You've been blocked by this account</p>
							<p class="mt-2 text-sm text-contrast-muted">You can no longer view this account's posts</p>
						</div>
					</Match>

					<Match when={shadow().blockUri}>
						<div class="mx-auto my-8 w-full max-w-80 p-4">
							<p class="text-xl font-bold">You've blocked this account</p>
							<p class="mt-2 text-sm text-contrast-muted">You can no longer view this account's posts</p>
						</div>
					</Match>

					<Match when>
						<Divider />

						<FilterBar
							value={filter()}
							onChange={setFilter}
							options={[
								{
									value: PostFilter.POSTS,
									label: `Posts`,
								},
								{
									value: PostFilter.POSTS_WITH_REPLIES,
									label: `Posts and replies`,
								},
								{
									value: PostFilter.MEDIA,
									label: `Media`,
								},
							]}
						/>

						<TimelineList
							timelineDid={did}
							params={{
								type: 'profile',
								actor: did,
								tab: filter(),
							}}
						/>
					</Match>
				</Switch>
			</div>
		</>
	);
};
