import { Match, Show, Switch, createMemo } from 'solid-js';

import type { AppBskyGraphDefs } from '@atcute/client/lexicons';
import { useQueryClient } from '@mary/solid-query';

import { ContextContentMedia } from '~/api/moderation/constants';
import { moderateGeneric } from '~/api/moderation/entities/generic';
import { moderateProfile } from '~/api/moderation/entities/profile';
import { precacheProfile } from '~/api/queries-cache/profile-precache';
import { createListMetaQuery } from '~/api/queries/list';
import { createListMembersQuery } from '~/api/queries/list-members';
import { trimRichText } from '~/api/utils/richtext';
import { makeAtUri } from '~/api/utils/strings';

import { useParams, useTitle } from '~/lib/navigation/router';
import { useModerationOptions } from '~/lib/states/moderation';

import Avatar, { getUserAvatarType } from '~/components/avatar';
import * as Boxed from '~/components/boxed';
import Button from '~/components/button';
import CircularProgressView from '~/components/circular-progress-view';
import ErrorView from '~/components/error-view';
import IconButton from '~/components/icon-button';
import MoreHorizOutlinedIcon from '~/components/icons-central/more-horiz-outline';
import * as Page from '~/components/page';
import PagedList from '~/components/paged-list';
import ProfileItem from '~/components/profiles/profile-item';
import VirtualItem from '~/components/virtual-item';

const ProfileModerationListPage = () => {
	const { did, rkey } = useParams();

	const uri = makeAtUri(did, 'app.bsky.graph.list', rkey);
	const query = createListMetaQuery(() => uri);

	useTitle(() => {
		const data = query.data;
		if (data) {
			return `${data.name} — ${import.meta.env.VITE_APP_NAME}`;
		}

		return `Moderation List — ${import.meta.env.VITE_APP_NAME}`;
	});

	return (
		<>
			<Page.Header>
				<Page.HeaderAccessory>
					<Page.Back to={`/${did}`} />
				</Page.HeaderAccessory>

				<Show when={!query.data}>
					<Page.Heading title="Moderation List" />
				</Show>

				<Show when={query.data}>
					{(list) => (
						<Page.HeaderAccessory>
							<Show when={!list().viewer?.blocked && !list().viewer?.muted}>
								<Button variant="primary" size="sm">
									Subscribe
								</Button>
							</Show>

							<IconButton
								title="More actions"
								icon={MoreHorizOutlinedIcon}
								onClick={() => {
									//
								}}
							/>
						</Page.HeaderAccessory>
					)}
				</Show>
			</Page.Header>

			<Switch>
				<Match when={query.data}>
					{(list) => (
						<>
							<InfoView list={list()} />
							<MembersList uri={uri} />
						</>
					)}
				</Match>

				<Match when={query.error}>
					{(error) => <ErrorView error={error()} onRetry={() => query.refetch()} />}
				</Match>

				<Match when>
					<CircularProgressView />
				</Match>
			</Switch>
		</>
	);
};

export default ProfileModerationListPage;

const InfoView = (props: { list: AppBskyGraphDefs.ListView }) => {
	const moderationOptions = useModerationOptions();
	const queryClient = useQueryClient();

	const list = () => props.list;
	const creator = () => list().creator;

	const moderation = createMemo(() => {
		return [
			...moderateGeneric(list(), creator().did, moderationOptions()),
			...moderateProfile(creator(), moderationOptions()),
		];
	});

	return (
		<Boxed.Container>
			<div class="px-4">
				<div class="flex gap-4">
					<Avatar
						type="list"
						src={list().avatar}
						size={null}
						moderation={moderation()}
						modContext={ContextContentMedia}
						class="h-13 w-13"
					/>

					<div class="flex min-w-0 grow flex-col">
						<p class="mb-1 mt-0.75 overflow-hidden text-ellipsis break-words text-lg font-bold leading-none">
							{list().name}
						</p>

						<a
							href={`/${creator().did}`}
							onClick={() => precacheProfile(queryClient, creator())}
							class="group mt-1 flex items-center"
						>
							<Avatar type={getUserAvatarType(creator())} src={creator().avatar} size="xs" class="mr-2" />

							<span class="mr-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium text-contrast-muted group-hover:underline">
								{creator().handle.toLowerCase()}
							</span>
						</a>
					</div>
				</div>
			</div>

			<Boxed.Group>
				<Boxed.List>
					<div class="flex flex-col whitespace-pre-wrap px-4 py-3 text-left text-sm empty:hidden">
						{trimRichText(list().description ?? '') || (
							<span class="text-contrast-muted">No description set.</span>
						)}
					</div>
				</Boxed.List>
			</Boxed.Group>
		</Boxed.Container>
	);
};

const MembersList = ({ uri }: { uri: string }) => {
	const members = createListMembersQuery(() => uri);

	return (
		<PagedList
			data={members.data?.pages.map((page) => page.members)}
			error={members.error}
			render={(item) => {
				return (
					<VirtualItem estimateHeight={64}>
						<ProfileItem item={/* @once */ item.subject} />
					</VirtualItem>
				);
			}}
			hasNextPage={members.hasNextPage}
			isFetchingNextPage={members.isFetching}
			onEndReached={() => members.fetchNextPage()}
		/>
	);
};
