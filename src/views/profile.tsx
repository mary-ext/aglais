import { createSignal, Match, Switch } from 'solid-js';

import type { AppBskyActorDefs } from '@mary/bluesky-client/lexicons';
import { XRPCError } from '@mary/bluesky-client/xrpc';
import { useQueryClient } from '@mary/solid-query';

import { createProfileQuery } from '~/api/queries/profile';
import { isDid } from '~/api/utils/strings';

import { history } from '~/globals/navigation';

import { formatCompact } from '~/lib/intl/number';
import { useParams } from '~/lib/navigation/router';

import CircularProgressView from '~/components/circular-progress-view';
import Divider from '~/components/divider';
import ErrorView from '~/components/error-view';
import FilterBar from '~/components/filter-bar';
import IconButton from '~/components/icon-button';
import MoreHorizOutlinedIcon from '~/components/icons-central/more-horiz-outline';
import * as Page from '~/components/page';

import TimelineList from '~/components/feeds/timeline-list';
import ProfileOverflowMenu from '~/components/profiles/profile-overflow-menu';
import ProfileViewHeader from '~/components/profiles/profile-view-header';
import { openModal } from '~/globals/modals';

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

	return (
		<>
			<ProfileViewHeader {...props} />
			{!props.isPlaceholderData ? <Divider /> : <CircularProgressView />}

			<div hidden={props.isPlaceholderData}>
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
					params={{
						type: 'profile',
						actor: props.data.did,
						tab: filter(),
					}}
				/>
			</div>
		</>
	);
};
