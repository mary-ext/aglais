import { Match, Show, Switch, createMemo } from 'solid-js';

import type { AppBskyFeedDefs } from '@atcute/client/lexicons';
import { useQueryClient } from '@mary/solid-query';

import { ContextContentMedia } from '~/api/moderation';
import { moderateGeneric } from '~/api/moderation/entities/generic';
import { moderateProfile } from '~/api/moderation/entities/profile';
import { precacheProfile } from '~/api/queries-cache/profile-precache';
import { createFeedMetaQuery } from '~/api/queries/feed';
import { makeAtUri } from '~/api/utils/strings';

import { useParams } from '~/lib/navigation/router';
import { useModerationOptions } from '~/lib/states/moderation';

import Avatar, { getUserAvatarType } from '~/components/avatar';
import * as Boxed from '~/components/boxed';
import CircularProgressView from '~/components/circular-progress-view';
import * as Page from '~/components/page';

const FeedInfoPage = () => {
	const { did, rkey } = useParams();

	const uri = makeAtUri(did, 'app.bsky.feed.generator', rkey);
	const feed = createFeedMetaQuery(() => uri);

	return (
		<>
			<Page.Header>
				<Page.HeaderAccessory>
					<Page.Back to={`/${did}/feeds/${rkey}`} />
				</Page.HeaderAccessory>
			</Page.Header>

			<Switch>
				<Match when={feed.data}>{(info) => <InfoView feed={info()} />}</Match>

				<Match when>
					<CircularProgressView />
				</Match>
			</Switch>
		</>
	);
};

export default FeedInfoPage;

const InfoView = (props: { feed: AppBskyFeedDefs.GeneratorView }) => {
	const moderationOptions = useModerationOptions();
	const queryClient = useQueryClient();

	const feed = () => props.feed;
	const creator = () => feed().creator;

	const moderation = createMemo(() => {
		return [
			...moderateGeneric(feed(), creator().did, moderationOptions()),
			...moderateProfile(creator(), moderationOptions()),
		];
	});

	return (
		<Boxed.Container>
			<div class="px-4">
				<div class="flex gap-4">
					<Avatar
						type="feed"
						src={feed().avatar}
						size={null}
						moderation={moderation()}
						modContext={ContextContentMedia}
						class="h-13 w-13"
					/>

					<div class="flex min-w-0 grow flex-col">
						<p class="mb-1 mt-0.75 overflow-hidden text-ellipsis break-words text-lg font-bold leading-none">
							{feed().displayName}
						</p>

						<a
							href={`/${creator().did}`}
							onClick={() => precacheProfile(queryClient, creator())}
							class="group mt-1 flex items-center"
						>
							<Avatar type={getUserAvatarType(creator())} src={creator().avatar} size="xs" class="mr-2" />

							<span class="mr-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-bold empty:hidden group-hover:underline">
								{creator().displayName}
							</span>
							<span class="overflow-hidden text-ellipsis whitespace-nowrap text-sm text-contrast-muted">
								{'@' + creator().handle}
							</span>
						</a>
					</div>
				</div>
			</div>

			<Boxed.Group>
				<Show when={feed().description?.trim()}>
					{(description) => (
						<Boxed.List>
							<div class="flex flex-col whitespace-pre-wrap px-4 py-3 text-left text-sm empty:hidden">
								{description()}
							</div>
						</Boxed.List>
					)}
				</Show>
			</Boxed.Group>
		</Boxed.Container>
	);
};
